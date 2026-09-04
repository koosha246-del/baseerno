-- Only one open (PENDING) order per user+course at a time. Sequential
-- resubmits are handled by checkout's reuse path; this index closes the
-- concurrent double-mint race (two tabs creating two chargeable payments).

-- First retire any duplicate open orders already in the data (keep the
-- newest per user+course), otherwise the unique index creation fails.
UPDATE "Payment" p
SET "status" = 'FAILED', "updatedAt" = now()
WHERE p."status" = 'PENDING'
  AND p."deletedAt" IS NULL
  AND p."id" <> (
    SELECT p2."id"
    FROM "Payment" p2
    WHERE p2."userId" = p."userId"
      AND p2."courseId" = p."courseId"
      AND p2."status" = 'PENDING'
      AND p2."deletedAt" IS NULL
    ORDER BY p2."createdAt" DESC, p2."id" DESC
    LIMIT 1
  );

-- CreateIndex (partial unique)
CREATE UNIQUE INDEX "Payment_userId_courseId_pending_uniq"
    ON "Payment"("userId", "courseId")
    WHERE "status" = 'PENDING' AND "deletedAt" IS NULL;
