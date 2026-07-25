-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gatewayAuthority" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gatewayRefId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_gatewayAuthority_key" ON "Payment"("gatewayAuthority");
