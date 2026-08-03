import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above const declarations — shared
// mocks must be created inside vi.hoisted().
const { emailOutbox, emailsSend } = vi.hoisted(() => ({
  emailOutbox: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  emailsSend: vi.fn(),
}));

vi.mock("@/lib/db/prisma-client", () => ({
  prisma: { emailOutbox },
}));

// `new Resend()` is called in email-queue.ts, so the mock must be a
// constructable function — an arrow function would throw "not a constructor".
vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: emailsSend } };
  }),
}));

vi.mock("@/lib/env", () => ({
  env: { RESEND_API_KEY: "test-resend-key" },
}));

// Import AFTER mocking so the module sees the mocks
import { enqueueEmail, processEmailQueue, cleanEmailQueue } from "../email-queue";

function makeRow(overrides: Partial<Parameters<typeof emailOutbox.findMany>[0]> = {}) {
  return {
    id: "e_1",
    to: "a@b.com",
    subject: "hi",
    html: "<p>x</p>",
    status: "pending",
    retries: 0,
    maxRetries: 3,
    lastError: null,
    nextAttemptAt: null,
    createdAt: new Date(),
    sentAt: null,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("email outbox queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailsSend.mockResolvedValue({ data: { id: "resend_1" }, error: null });
  });

  describe("enqueueEmail", () => {
    it("creates a row and never throws", async () => {
      emailOutbox.create.mockResolvedValue({ id: "e_1" });
      await expect(
        enqueueEmail({ to: "a@b.com", subject: "hi", html: "<p>x</p>" }),
      ).resolves.toBeUndefined();
      expect(emailOutbox.create).toHaveBeenCalledOnce();
      expect(emailOutbox.create).toHaveBeenCalledWith({
        data: { to: "a@b.com", subject: "hi", html: "<p>x</p>" },
      });
    });

    it("swallows DB errors", async () => {
      emailOutbox.create.mockRejectedValueOnce(new Error("DB down"));
      await expect(
        enqueueEmail({ to: "a@b.com", subject: "hi", html: "<p>x</p>" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("processEmailQueue", () => {
    it("returns 0 and does NOT mark rows failed when no Resend key", async () => {
      const envMock = await import("@/lib/env");
      const env = (envMock as { env: { RESEND_API_KEY: string } }).env;

      // Always restore the shared mock, even if an assertion throws.
      try {
        env.RESEND_API_KEY = "";
        const sent = await processEmailQueue(10);
        expect(sent).toBe(0);
        expect(emailOutbox.updateMany).not.toHaveBeenCalled();
      } finally {
        env.RESEND_API_KEY = "test-resend-key";
      }
    });

    it("sends due pending emails and marks them sent", async () => {
      emailOutbox.findMany.mockResolvedValue([makeRow()]);
      emailOutbox.update.mockResolvedValue({});

      const sent = await processEmailQueue(10);

      expect(emailsSend).toHaveBeenCalledOnce();
      expect(emailOutbox.update).toHaveBeenCalledWith({
        where: { id: "e_1" },
        data: expect.objectContaining({ status: "sent" }),
      });
      expect(sent).toBe(1);
    });

    it("retries with backoff until maxRetries, then marks failed", async () => {
      // First attempt fails
      emailsSend.mockRejectedValueOnce(new Error("Resend 429"));
      emailOutbox.findMany.mockResolvedValue([makeRow()]);
      emailOutbox.update.mockResolvedValue({});

      await processEmailQueue(10);
      expect(emailOutbox.update).toHaveBeenCalledWith({
        where: { id: "e_1" },
        data: expect.objectContaining({
          status: "pending",
          retries: 1,
          lastError: "Resend 429",
        }),
      });

      // Assert backoff timestamp is set in the future
      const updateCall = emailOutbox.update.mock.calls[0]?.[0] as {
        data: { nextAttemptAt: Date | null };
      };
      expect(updateCall.data.nextAttemptAt).toBeInstanceOf(Date);
      expect(updateCall.data.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now());

      // Simulate attempts 2 and 3 failing → final attempt marks failed
      emailsSend.mockRejectedValue(new Error("Resend 429"));
      // Row now has retries=1 after first failure
      emailOutbox.findMany.mockResolvedValue([makeRow({ retries: 1 })]);
      await processEmailQueue(10);
      emailOutbox.findMany.mockResolvedValue([makeRow({ retries: 2 })]);
      await processEmailQueue(10);

      // The final update should set status failed and clear nextAttemptAt
      const allUpdates = emailOutbox.update.mock.calls.map(
        (c) => (c[0] as { data: { status?: string; nextAttemptAt?: Date | null } }).data,
      );
      const finalUpdate = allUpdates[allUpdates.length - 1]!;
      expect(finalUpdate.status).toBe("failed");
      expect(finalUpdate.nextAttemptAt).toBeNull();
    });

    it("skips rows that have already exhausted their retries", async () => {
      // A row with retries >= maxRetries must not be sent again
      emailOutbox.findMany.mockResolvedValue([makeRow({ retries: 3, maxRetries: 3 })]);
      const sent = await processEmailQueue(10);
      expect(sent).toBe(0);
      expect(emailsSend).not.toHaveBeenCalled();
    });

    it("respects per-row maxRetries different from default", async () => {
      emailsSend.mockRejectedValueOnce(new Error("fail"));
      emailOutbox.findMany.mockResolvedValue([makeRow({ retries: 1, maxRetries: 2 })]);
      await processEmailQueue(10);
      const updateCall = emailOutbox.update.mock.calls[0]?.[0] as {
        data: { status?: string };
      };
      // retries becomes 2 == maxRetries 2 → failed on this attempt
      expect(updateCall.data.status).toBe("failed");
    });
  });

  describe("cleanEmailQueue", () => {
    it("deletes old sent/failed rows and returns the count", async () => {
      emailOutbox.deleteMany.mockResolvedValue({ count: 7 });
      const deleted = await cleanEmailQueue(30);
      expect(deleted).toBe(7);
      expect(emailOutbox.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ status: "sent" }, { status: "failed" }],
          createdAt: { lt: expect.any(Date) },
        },
      });
    });
  });
});