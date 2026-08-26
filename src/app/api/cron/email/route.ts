/**
 * Cron Job: process pending emails.
 *
 * Triggered by Vercel Cron Jobs (cron: "*\/5 * * * *").
 * Protected by a secret header to prevent public access.
 */
import { NextResponse } from "next/server";
import { processEmailQueue, cleanEmailQueue } from "@/lib/email-queue";
import { env } from "@/lib/env";
import { timingSafeEqual } from "node:crypto";

export const maxDuration = 120; // 2 minutes
export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Accepts the secret via either:
 *  - `x-cron-secret: <secret>` (external schedulers / curl)
 *  - `Authorization: Bearer <secret>` (Vercel managed cron can only send this)
 */
function extractProvidedSecret(req: Request): string | null {
  const header = req.headers.get("x-cron-secret");
  if (header) return header;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

export async function GET(req: Request) {
  // Protect the cron endpoint with a secret. Fail CLOSED: if
  // CRON_SECRET is not configured, the endpoint refuses to run instead of
  // silently processing the queue for anyone who discovers the URL.
  const provided = extractProvidedSecret(req);
  const expected = env.CRON_SECRET;
  if (!expected || !provided || !safeCompare(provided, expected)) {
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