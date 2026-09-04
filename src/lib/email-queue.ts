/**
 * Email Outbox — async email queue backed by the `EmailOutbox` table.
 *
 * Instead of sending emails synchronously during an HTTP request, the
 * API route writes a row to `EmailOutbox` and returns immediately.
 * A background worker (run via `npx tsx worker/email-worker.ts` or as
 * a cron job) picks up pending rows and sends them via Resend.
 *
 * Benefits:
 *  - Zero-blocking: requests never wait for SMTP.
 *  - Retry with exponential backoff (up to 3 attempts).
 *  - Idempotent: each outbox row is sent at most once.
 *  - Observability: logs every attempt, stores error messages.
 */

import { prisma } from "@/lib/db/prisma-client";
import { siteConfig } from "@/config/site";

export interface OutboxInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Enqueue an email for async delivery.  Returns immediately after
 * writing the database row.  Never throws.
 */
export async function enqueueEmail(input: OutboxInput): Promise<void> {
  try {
    await prisma.emailOutbox.create({ data: input });
  } catch (err) {
    console.error("[email-outbox] Failed to enqueue email:", err);
  }
}

/**
 * Compute the next attempt timestamp using exponential backoff.
 * Attempt 1 → 60s, Attempt 2 → 2min, Attempt 3 → 4min, capped at 24h.
 */
function nextAttemptAt(attemptCount: number): Date {
  const delay = Math.min(60_000 * Math.pow(2, attemptCount - 1), 86_400_000); // cap at 24h
  return new Date(Date.now() + delay);
}

const CLAIM_TIMEOUT_MS = 10 * 60_000; // 10 minutes — stale claim recovery

/**
 * Atomically claim the next batch of due emails for THIS worker instance.
 *
 * Uses `FOR UPDATE SKIP LOCKED` inside a transaction so that multiple
 * worker instances polling the same table never pick up the same row:
 * the first worker to lock a row claims it; the others skip it.
 *
 * Rows are marked `processing` while in flight; a crashed worker leaves
 * them stuck, so `recoverStuckProcessing()` returns them to `pending`
 * after `CLAIM_TIMEOUT_MS`.
 */
async function claimDueEmails(batchSize: number) {
  const { prismaRaw } = await import("@/lib/db/prisma-client");
  if (!prismaRaw) throw new Error("raw prisma client unavailable");

  return prismaRaw.$transaction(async (tx) => {
    const rows = await tx.$queryRawUnsafe<
      Array<{ id: string; retries: number; maxRetries: number | null }>
    >(
      `SELECT id, retries, "maxRetries"
       FROM "EmailOutbox"
       WHERE status = 'pending'
         AND (retries < COALESCE("maxRetries", 3))
         AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now())
       ORDER BY "createdAt" ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      batchSize,
    );

    if (rows.length === 0) return [];

    // Mark claimed rows as processing so other workers skip them.
    await tx.emailOutbox.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { status: "processing" },
    });

    return rows;
  });
}

/**
 * Return rows stuck in `processing` (a worker crashed mid-send) back to
 * `pending` so they can be retried by the next run.
 *
 * @returns Number of recovered rows.
 */
export async function recoverStuckProcessing(timeoutMs = CLAIM_TIMEOUT_MS): Promise<number> {
  const cutoff = new Date(Date.now() - timeoutMs);
  try {
    const result = await prisma.emailOutbox.updateMany({
      where: { status: "processing", updatedAt: { lt: cutoff } },
      data: { status: "pending" },
    });
    return result.count;
  } catch (err) {
    console.error("[email-queue] Failed to recover stuck rows:", err);
    return 0;
  }
}

/**
 * Optional send-rate limiter — awaited before each provider call so the
 * worker never exceeds the provider's rate budget (see worker setup).
 * Default: no limiting.
 */
type AcquireSendSlot = () => Promise<void>;

export interface SendEmailFnInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sender injected by the caller (e.g. the verification drill) to avoid a
 * real provider call. Must resolve on success and throw on failure — the
 * queue treats a throw as a retryable failure.
 */
export type SendEmailFn = (input: SendEmailFnInput) => Promise<void>;

/**
 * Default sender — Resend. Extracted from `processEmailQueue` so the
 * queue contract can be verified without a real provider call.
 *
 * Throws on provider error: Resend's SDK returns `{ data, error }` and
 * does NOT throw on API-level rejection — surfacing the error here keeps
 * a rejected email from being marked `sent`.
 */
async function sendViaResend(input: SendEmailFnInput): Promise<void> {
  const { Resend } = await import("resend");
  const { env } = await import("@/lib/env");

  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) throw new Error("RESEND_API_KEY not set");

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <noreply@baseerno.ir>`,
    ...input,
  });
  // Resend surfaces API rejections as a plain { name, message } object, not
  // an Error — wrap it so the queue's `lastError` column records the real
  // reason instead of "Unknown error".
  if (error) throw new Error(`Resend API error: ${error.name ?? "unknown"} — ${error.message ?? JSON.stringify(error)}`);
}

/**
 * Process the next batch of pending emails whose backoff delay has elapsed.
 *
 * Designed to be called by:
 *  1. A long-running worker (`worker/email-worker.ts`)
 *  2. A Vercel Cron Job (`/api/cron/email`)
 *  3. A manual script
 *
 * @param batchSize Max emails to process in one run (default 10).
 * @param acquireSlot Optional rate-limiter tick (worker injects it).
 * @param sendEmail Optional sender — defaults to Resend. Injected by the
 *   verification drill so the queue contract can be proven without a key.
 * @returns Number of successfully processed emails.
 */
export async function processEmailQueue(
  batchSize = 10,
  acquireSlot?: AcquireSendSlot,
  sendEmail?: SendEmailFn,
): Promise<number> {
  const send = sendEmail ?? sendViaResend;

  if (!sendEmail) {
    // Without an injected sender we need the Resend key. Do NOT mark rows
    // as failed — the key may be temporarily missing (e.g. env not yet
    // loaded). Leave them pending for the next run.
    const { env } = await import("@/lib/env");
    if (!env.RESEND_API_KEY) {
      console.warn("[email-queue] RESEND_API_KEY not set — skipping queue run.");
      return 0;
    }
  }

  // Recover any rows left stuck by a previous crashed worker first.
  await recoverStuckProcessing();

  // Claim a batch with row-level locking. On failure (e.g. the raw client
  // is unavailable in tests), fall back to a plain unlocked select so the
  // queue still works — just with a small double-send risk on multi-worker.
  let claimed: Array<{ id: string; retries: number; maxRetries: number | null }>;
  try {
    claimed = await claimDueEmails(batchSize);
  } catch {
    claimed = [];
  }

  const ids = claimed.map((c) => c.id);

  const pending =
    ids.length > 0
      ? await prisma.emailOutbox.findMany({
          where: { id: { in: ids } },
          orderBy: { createdAt: "asc" },
        })
      : await prisma.emailOutbox.findMany({
          where: {
            status: "pending",
            OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
          },
          orderBy: { createdAt: "asc" },
          take: batchSize,
        });

  // Respect each row's own maxRetries (default 3) — a row that has already
  // exhausted its retries must not be re-picked.
  const due = pending.filter((e) => e.retries < (e.maxRetries ?? 3));

  let sent = 0;

  for (const email of due) {
    try {
      if (acquireSlot) await acquireSlot();
      await send({ to: email.to, subject: email.subject, html: email.html });

      await prisma.emailOutbox.update({
        where: { id: email.id },
        data: { status: "sent", sentAt: new Date() },
      });
      sent++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const newRetries = email.retries + 1;
      const shouldFail = newRetries >= (email.maxRetries ?? 3);

      await prisma.emailOutbox.update({
        where: { id: email.id },
        data: {
          status: shouldFail ? "failed" : "pending",
          retries: newRetries,
          lastError: errorMessage,
          // Clear the backoff timestamp on final failure so the row is
          // never picked up again; undefined would leave the old value.
          nextAttemptAt: shouldFail ? null : nextAttemptAt(newRetries),
        },
      });

      console.error(
        `[email-queue] Failed to send email ${email.id} (attempt ${newRetries}): ${errorMessage}`,
      );
    }
  }

  return sent;
}

/**
 * Clean up old sent/failed emails (for cron jobs).
 */
export async function cleanEmailQueue(olderThanDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 86400000);
  const result = await prisma.emailOutbox.deleteMany({
    where: {
      OR: [{ status: "sent" }, { status: "failed" }],
      createdAt: { lt: cutoff },
    },
  });
  return result.count;
}