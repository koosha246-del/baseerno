/**
 * End-to-end verification of the email outbox queue (گام ۶ gate).
 *
 *   npm run verify:email-queue   → runs the drill against real Postgres
 *
 * Proves the QUEUE CONTRACT against a REAL database (no mocks, no Resend):
 *   1. enqueue → process → row marked `sent` with sentAt
 *   2. exponential backoff: 3 failing attempts → nextAttemptAt bumps forward
 *      each time, then the row lands in `failed` with nextAttemptAt cleared
 *   3. rows that exhausted their retries are never re-claimed
 *   4. rows stuck in `processing` (crashed worker) are recovered and delivered
 *   5. idempotency: a second pass sends nothing (no double-send)
 *
 * The sender is injected as a stub — this gate proves the queue mechanics
 * (locking, backoff, retry ceiling, recovery), not the provider.
 *
 * Gate semantics: every check failure is fatal (exit 1).
 */
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { withUtcSession } from "../src/lib/db/conn";

/** Minimal .env loader — dev convenience; exported vars always win. */
function loadDotEnv(): void {
  try {
    const content = readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]!]) {
        process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env file — rely on the exported environment.
  }
}

loadDotEnv();

let failures = 0;
function check(label: string, ok: boolean): void {
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures++;
}

const OK = "verify-email-ok@drill.local";
const FAIL = "verify-email-fail@drill.local";
const SKIP = "verify-email-skip@drill.local";
const STUCK = "verify-email-stuck@drill.local";

/** Injected sender — throws only for the address the ladder tests with. */
async function stubSend(input: { to: string; subject: string; html: string }): Promise<void> {
  if (input.to === FAIL) throw new Error("stub: provider rejected (simulated 429)");
}

async function main(): Promise<void> {
  const { PrismaClient } = await import("../src/generated/prisma/client");
  // Pin the session to UTC (see src/lib/db/conn.ts) — the drill must prove the
  // queue contract under the SAME timezone conditions the app runs in, so it
  // passes on a Tehran-configured server exactly like production code does.
  const adapter = new PrismaPg({
    connectionString: withUtcSession(process.env.DATABASE_URL ?? ""),
  });
  const db = new PrismaClient({ adapter });
  const { enqueueEmail, processEmailQueue } = await import("../src/lib/email-queue");

  const clearDrill = async () =>
    db.emailOutbox.deleteMany({ where: { to: { contains: "@drill.local" } } });

  // ── 1. Enqueue → sent ────────────────────────────────────────────
  await clearDrill();
  await enqueueEmail({ to: OK, subject: "drill", html: "<p>1</p>" });
  const pre = await db.emailOutbox.findFirst({ where: { to: OK } });
  check("enqueueEmail writes a pending row", pre?.status === "pending");

  const sent1 = await processEmailQueue(10, undefined, stubSend);
  check("processEmailQueue sends the due row", sent1 === 1);
  const post = await db.emailOutbox.findFirst({ where: { to: OK } });
  check("row marked sent with sentAt", post?.status === "sent" && post.sentAt !== null);

  // ── 2. Retry ladder: backoff bumps, then final failure ───────────
  await enqueueEmail({ to: FAIL, subject: "drill", html: "<p>2</p>" });
  const backoffStamps: number[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    await processEmailQueue(10, undefined, stubSend);
    const row = await db.emailOutbox.findFirst({ where: { to: FAIL } });
    const isLast = attempt === 2;
    check(
      `attempt ${attempt + 1}: ${isLast ? "marked failed" : "kept pending (backoff)"}`,
      row ? (isLast ? row.status === "failed" : row.status === "pending") : false,
    );
    if (row?.nextAttemptAt && !isLast) backoffStamps.push(row.nextAttemptAt.getTime());
    // Simulate the backoff delay elapsing so the next attempt is due.
    if (!isLast && row) {
      await db.emailOutbox.update({
        where: { id: row.id },
        data: { status: "pending", nextAttemptAt: null },
      });
    }
  }
  check(
    "backoff timestamps strictly increase",
    backoffStamps.length === 2 && backoffStamps[0]! < backoffStamps[1]!,
  );
  const failRow = await db.emailOutbox.findFirst({ where: { to: FAIL } });
  check(
    "failed row: retries hit ceiling, nextAttemptAt cleared",
    failRow?.status === "failed" && failRow?.retries === 3 && failRow?.nextAttemptAt === null,
  );

  // ── 3. Exhausted rows are never re-claimed ───────────────────────
  await db.emailOutbox.create({
    data: {
      to: SKIP,
      subject: "drill",
      html: "<p>3</p>",
      status: "pending",
      retries: 3,
      maxRetries: 3,
      nextAttemptAt: null,
    },
  });
  await processEmailQueue(10, undefined, stubSend);
  const skipRow = await db.emailOutbox.findFirst({ where: { to: SKIP } });
  check("exhausted row stays pending (not re-claimed)", skipRow?.status === "pending");

  // ── 4. Stuck processing rows are recovered and delivered ─────────
  // Negative case first: a FRESH processing row (within the 10-min claim
  // timeout) must NOT be recovered — the worker may still be alive.
  const FRESH = "verify-email-fresh@drill.local";
  await db.emailOutbox.create({
    data: {
      to: FRESH,
      subject: "drill",
      html: "<p>4a</p>",
      status: "processing",
      retries: 0,
      maxRetries: 3,
    },
  });
  await processEmailQueue(10, undefined, stubSend);
  const freshRow = await db.emailOutbox.findFirst({ where: { to: FRESH } });
  check("fresh processing row NOT recovered (still processing)", freshRow?.status === "processing");

  // Positive case: age the row past CLAIM_TIMEOUT_MS (10 min) so recovery
  // kicks in, then it is claimed and delivered.
  await db.emailOutbox.create({
    data: {
      to: STUCK,
      subject: "drill",
      html: "<p>4</p>",
      status: "processing",
      retries: 0,
      maxRetries: 3,
    },
  });
  await db.$executeRaw`UPDATE "EmailOutbox" SET "updatedAt" = now() - interval '15 minutes' WHERE "to" = ${STUCK}`;
  const sentRecovered = await processEmailQueue(10, undefined, stubSend);
  const stuckRow = await db.emailOutbox.findFirst({ where: { to: STUCK } });
  check("stuck processing row recovered and delivered", sentRecovered === 1 && stuckRow?.status === "sent");

  // ── 5. Idempotency — nothing left to send ────────────────────────
  const sentAgain = await processEmailQueue(10, undefined, stubSend);
  check("second pass sends nothing (no double-send)", sentAgain === 0);

  // ── Cleanup ──────────────────────────────────────────────────────
  await clearDrill();
  const leftover = await db.emailOutbox.count({ where: { to: { contains: "@drill.local" } } });
  check("drill rows cleaned up", leftover === 0);

  await db.$disconnect();

  if (failures > 0) {
    console.log(`\n❌ ${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\n🎉 Email queue drill passed: queue contract verified against real Postgres.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Drill crashed:", err);
  process.exit(1);
});
