-- Speed up the email-queue claim query:
--   WHERE status = 'pending' AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now())
-- Without this index every poll scans all pending rows (including ones
-- still in exponential-backoff wait) to evaluate the nextAttemptAt filter.
CREATE INDEX "EmailOutbox_status_nextAttemptAt_idx"
  ON "EmailOutbox"("status", "nextAttemptAt");
