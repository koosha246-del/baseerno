/**
 * CAPTCHA verification — reCAPTCHA v3 server-side validation.
 *
 * Usage:
 * ```ts
 * import { verifyCaptcha } from "@/lib/captcha";
 *
 * const valid = await verifyCaptcha(token);
 * if (!valid) { return errorResponse; }
 * ```
 *
 * When `RECAPTCHA_SECRET_KEY` is not configured (dev/test), auto-passes.
 */

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Verify a reCAPTCHA v3 token server-side.
 *
 * In dev/test without `RECAPTCHA_SECRET_KEY`, always returns `true` so
 * front-end forms can use a placeholder token and still work locally.
 *
 * @param token - The `g-recaptcha-response` token from the client.
 * @returns `true` if valid or unconfigured; `false` on invalid/failed.
 */
export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  if (!env.captchaConfigured) {
    return true; // Auto-pass in dev/test
  }
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    logger.error("CAPTCHA verification request failed", { module: "captcha", error });
    return false;
  }
}
