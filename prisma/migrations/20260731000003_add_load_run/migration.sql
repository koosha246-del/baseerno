-- CreateTable
CREATE TABLE "LoadRun" (
    "id" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "vus" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "pass" BOOLEAN NOT NULL,
    "scenarios" JSONB NOT NULL,
    "cacheHits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoadRun_createdAt_idx" ON "LoadRun"("createdAt");
