/**
 * Cron Job: process pending emails.
 *
 * Triggered by Vercel Cron Jobs (cron: "*\/5 * * * *").
 * Protected by a secret header to prevent public access.
 */
import { NextResponse } from "next/server";
import { processEmailQueue, cleanEmailQueue } from "@/lib/email-queue";

export const maxDuration = 120; // 2 minutes
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Protect the cron endpoint with a secret header
  // Set CRON_SECRET in your environment and pass it as `x-cron-secret`
  const cronSecret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (expected && cronSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await processEmailQueue(20);
  const cleaned = await cleanEmailQueue(30);

  return NextResponse.json({
    ok: true,
    emailsSent: sent,
    recordsCleaned: cleaned,
    timestamp: new Date().toISOString(),
  });
}