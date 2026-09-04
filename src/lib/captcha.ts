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
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }).toString(),
    });
    const data = await response.json();
    if (data.success !== true) return false;
    // reCAPTCHA v3 returns a 0.0–1.0 confidence score. Without checking it,
    // a low-score bot token passes and the captcha is decorative. 0.5 is
    // Google's documented "likely human" midpoint; tune per false-positive
    // rate once real traffic is observed.
    if (typeof data.score === "number" && data.score < 0.5) {
      logger.warn("CAPTCHA score below threshold", {
        module: "captcha",
        score: data.score,
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("CAPTCHA verification request failed", { module: "captcha", error });
    return false;
  }
}
