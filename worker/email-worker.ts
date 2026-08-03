/**
 * Email Outbox Worker — runs in a loop, processing pending emails.
 *
 * Usage:
 *   npx tsx worker/email-worker.ts
 *
 * Deploy as a separate process (e.g. a second container or a Vercel
 * Cron Job calling `/api/cron/email`).
 */

import { processEmailQueue, cleanEmailQueue } from "../src/lib/email-queue";

const POLL_INTERVAL_MS = 10_000; // 10 seconds
const CLEANUP_INTERVAL_MS = 86_400_000; // 24 hours
/** Never call Resend more than this many times per second. */
const MAX_SEND_RATE_PER_SECOND = 8;

let running = true;

/**
 * Minimal in-process rate limiter: ensures at most `maxPerSecond` calls
 * to the email provider per second, so a backlog can't trip Resend's
 * own rate limits (which would then re-queue everything with backoff).
 */
function createSendRateLimiter(maxPerSecond: number) {
  const window = new Map<number, number>(); // secondBucket -> count
  return async function acquire(): Promise<void> {
    for (;;) {
      const bucket = Math.floor(Date.now() / 1000);
      const count = window.get(bucket) ?? 0;
      if (count < maxPerSecond) {
        window.set(bucket, count + 1);
        // Prune old buckets occasionally.
        if (window.size > 60) {
          for (const key of [...window.keys()]) {
            if (key < bucket - 5) window.delete(key);
          }
        }
        return;
      }
      const waitMs = (bucket + 1) * 1000 - Date.now() + 20;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  };
}

const acquireSendSlot = createSendRateLimiter(MAX_SEND_RATE_PER_SECOND);

// Graceful shutdown on SIGTERM/SIGINT
process.on("SIGTERM", () => {
  console.log("[email-worker] SIGTERM received, shutting down gracefully...");
  running = false;
});
process.on("SIGINT", () => {
  console.log("[email-worker] SIGINT received, shutting down gracefully...");
  running = false;
});

async function main() {
  console.log("[email-worker] Starting email outbox worker...");
  let lastCleanup = 0;

  while (running) {
    try {
      const sent = await processEmailQueue(10, acquireSendSlot);
      if (sent > 0) {
        console.log(`[email-worker] Sent ${sent} email(s)`);
      }
    } catch (err) {
      console.error("[email-worker] Error processing queue:", err);
    }

    // Daily cleanup of old records
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
      try {
        const cleaned = await cleanEmailQueue(30);
        console.log(`[email-worker] Cleaned up ${cleaned} old email records`);
      } catch (err) {
        console.error("[email-worker] Cleanup error:", err);
      }
      lastCleanup = now;
    }

    // Wait with a shorter polling interval for responsiveness to shutdown
    if (running) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  console.log("[email-worker] Shutdown complete.");
}

main().catch((err) => {
  console.error("[email-worker] Fatal error:", err);
  process.exit(1);
});