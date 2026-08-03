-- Convert EmailOutbox timestamps to TIMESTAMPTZ.
--
-- Why: on servers whose TimeZone is not UTC (e.g. Asia/Tehran), naive
-- `timestamp` columns hold two different clock domains: raw `now()`
-- writes store local wall time, while Prisma writes store JS UTC
-- instants. That skew broke exponential backoff (rows looked due ~3.5h
-- early) and stuck-row recovery (rows looked fresh, never recovered).
-- TIMESTAMPTZ stores absolute instants, so every writer lands in the
-- same clock domain and comparisons against JS `Date` objects work.
ALTER TABLE "EmailOutbox"
  ALTER COLUMN "nextAttemptAt" SET DATA TYPE TIMESTAMPTZ(3);
ALTER TABLE "EmailOutbox"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);
ALTER TABLE "EmailOutbox"
  ALTER COLUMN "sentAt" SET DATA TYPE TIMESTAMPTZ(3);
ALTER TABLE "EmailOutbox"
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);
