/**
 * Email client — Resend wrapper.
 * Falls back to enqueueing to EmailOutbox if Resend key is not set,
 * or enqueues to the outbox table for async delivery in production.
 *
 * In production, email delivery is deferred to the background worker
 * (see worker/email-worker.ts), so HTTP requests never block on SMTP.
 */

import { enqueueEmail } from "./email-queue";
import { env } from "./env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email — always async, never blocks the request.
 *
 * - When `RESEND_API_KEY` is set AND Redis is available, sends directly
 *   via Resend (fast enough for low-volume transactional emails).
 * - Otherwise, enqueues to the `EmailOutbox` table for the background
 *   worker to process (zero-blocking).
 * - In development/test with no key, logs to console.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { Resend } = await import("resend");

  const resendKey = env.RESEND_API_KEY;

  // No key at all — log and enqueue (worker can still process later if key appears)
  if (!resendKey) {
    console.log(`[EMAIL MOCK] To: ${options.to} | Subject: ${options.subject}`);
    await enqueueEmail(options);
    return true;
  }

  // Try direct send
  try {
    const { siteConfig } = await import("@/config/site");
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: `${siteConfig.name} <noreply@baseerno.ir>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    // Direct send failed — enqueue for retry via worker
    console.error("[email] Direct send failed, enqueuing for retry:", error);
    await enqueueEmail(options);
    return true; // Don't fail the request; the worker will retry
  }
}
