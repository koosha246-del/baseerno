/**
 * UseCase: Request a password reset link.
 *
 * Finds the user, creates a reset token, and publishes the
 * `user:password-reset` event — the event bus sends the email, so this
 * use case never touches SMTP directly.  Always returns success (even for
 * unknown emails) to prevent enumeration.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { publish } from "@/lib/events";

export const forgotPasswordSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordResult {
  ok: true;
  message: string;
}

export type ForgotPasswordResponse = ForgotPasswordResult;

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResponse> {
  const user = await repository.findUserByEmail(input.email);

  // Always return success to prevent email enumeration
  if (!user) {
    return { ok: true, message: "اگر ایمیل وجود داشته باشد، لینک بازیابی ارسال شد." };
  }

  const reset = await repository.createPasswordReset(user.id);

  // Send reset email via the event bus (user:password-reset handler).
  // Awaited on purpose: on serverless platforms a fire-and-forget promise
  // can be frozen the moment the response returns, losing the email. The
  // handler itself never rejects (errors are caught inside the bus), and
  // sendEmail falls back to the outbox queue, so awaiting is safe.
  // Prefer the deployment's own URL so staging/preview links never point
  // at production (leaking live reset tokens into prod logs).
  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const resetUrl = `${baseUrl}/reset-password?token=${reset.token}`;
  await publish({
    type: "user:password-reset",
    userId: user.id,
    email: user.email,
    name: user.name,
    resetUrl,
  });

  // In development only, log the reset URL so developers can test without
  // a mail server. NEVER return the raw token in API responses — even in
  // development — to prevent accidental leaks via staging/preview deployments.
  if (env.isDevelopment) {
    console.log(`[DEV] Password reset URL: ${resetUrl}`);
  }

  return {
    ok: true,
    message: "لینک بازیابی رمز عبور به ایمیل شما ارسال شد.",
  };
}

/** Convert a UseCase response to a NextResponse (always 200). */
export function buildUseCaseResponse(result: ForgotPasswordResponse): NextResponse {
  return NextResponse.json({
    ok: true,
    message: result.message,
  });
}
