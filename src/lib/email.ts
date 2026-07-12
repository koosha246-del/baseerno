/**
 * Email client — Resend wrapper.
 * Falls back to console.log if RESEND_API_KEY is not set.
 */

import { Resend } from "resend";
import { siteConfig } from "@/config/site";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const client = getClient();

  if (!client) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    await client.emails.send({
      from: `${siteConfig.name} <noreply@baseerno.ir>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
