/**
 * Integration tests for the email outbox queue against a REAL PostgreSQL.
 *
 * The DATABASE is real — only the external Resend HTTP call is mocked.
 * These self-skip when DATABASE_URL is absent (local dev), and run in CI
 * where the postgres service is provisioned.
 *
 * `EmailOutbox` has no Prisma migration yet, so the test creates the table
 * idempotently in beforeAll (mirroring prisma/schema.prisma).
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("email-queue (integration, real Postgres)", () => {
  let prisma: typeof import("@/lib/db/prisma-client").prisma;
  let queue: typeof import("@/lib/email-queue");
  let unique = "";

  beforeAll(async () => {
    unique = `it-${Date.now()}`;
    // Set the key BEFORE anything imports @/lib/env (prisma → env chain).
    vi.stubEnv("RESEND_API_KEY", "re_test_mock_key");

    prisma = (await import("@/lib/db/prisma-client")).prisma;
    queue = await import("@/lib/email-queue");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailOutbox" (
        id TEXT PRIMARY KEY,
        "to" TEXT NOT NULL,
        subject TEXT NOT NULL,
        html TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retries INTEGER NOT NULL DEFAULT 0,
        "maxRetries" INTEGER NOT NULL DEFAULT 3,
        "lastError" TEXT,
        "nextAttemptAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentAt" TIMESTAMP(3),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.emailOutbox.deleteMany({ where: { to: { startsWith: unique } } });
  });

  afterAll(async () => {
    await prisma.emailOutbox.deleteMany({ where: { to: { startsWith: unique } } });
    vi.unstubAllEnvs();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    sendMock.mockReset();
  });

  it("enqueues a pending row and processes it to sent", async () => {
    const to = `${unique}@example.com`;
    await queue.enqueueEmail({ to, subject: "تست صف ایمیل", html: "<p>سلام</p>" });

    const row = await prisma.emailOutbox.findFirst({ where: { to } });
    expect(row).not.toBeNull();
    expect(row!.status).toBe("pending");

    sendMock.mockResolvedValue({ data: { id: "mock-1" } });
    const sent = await queue.processEmailQueue(10);
    expect(sent).toBeGreaterThanOrEqual(1);

    const updated = await prisma.emailOutbox.findFirst({ where: { to } });
    expect(updated!.status).toBe("sent");
    expect(updated!.sentAt).not.toBeNull();
  });

  it("marks the row failed once it exhausts maxRetries", async () => {
    const to = `${unique}-fail@example.com`;
    await queue.enqueueEmail({ to, subject: "تست خطا", html: "<p>x</p>" });

    // Set maxRetries=1 so a single run exhausts the retry budget — the
    // exponential backoff (nextAttemptAt in the future) would otherwise
    // prevent immediate re-picking between consecutive runs.
    await prisma.emailOutbox.updateMany({
      where: { to },
      data: { maxRetries: 1 },
    });

    sendMock.mockRejectedValue(new Error("Resend 429"));
    await queue.processEmailQueue(10);

    const row = await prisma.emailOutbox.findFirst({ where: { to } });
    expect(row).not.toBeNull();
    expect(row!.status).toBe("failed");
    expect(row!.retries).toBe(1);
    expect(row!.nextAttemptAt).toBeNull();
    expect(row!.lastError).toContain("Resend 429");
  });

  it("cleanEmailQueue deletes old sent rows", async () => {
    await prisma.emailOutbox.create({
      data: {
        id: `${unique}-old`,
        to: `${unique}-old@example.com`,
        subject: "قدیمی",
        html: "<p>y</p>",
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(Date.now() - 40 * 86400000), // 40 days ago
      },
    });

    const cleaned = await queue.cleanEmailQueue(30);
    expect(cleaned).toBeGreaterThanOrEqual(1);

    const gone = await prisma.emailOutbox.findUnique({ where: { id: `${unique}-old` } });
    expect(gone).toBeNull();
  });
});
