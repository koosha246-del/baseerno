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
  _devToken?: string;
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
  // Fire-and-forget: the response must never wait on SMTP. publish() never
  // rejects (handler errors are caught and logged inside the event bus).
  const resetUrl = `${siteConfig.url}/reset-password?token=${reset.token}`;
  void publish({
    type: "user:password-reset",
    userId: user.id,
    email: user.email,
    name: user.name,
    resetUrl,
  });

  // Only expose the raw token in non-production so developers can test
  // the reset flow without a configured mail server. Never leak it in prod.
  const isDev = !env.isProduction;
  return {
    ok: true,
    message: "لینک بازیابی رمز عبور به ایمیل شما ارسال شد.",
    ...(isDev ? { _devToken: reset.token } : {}),
  };
}

/** Convert a UseCase response to a NextResponse (always 200). */
export function buildUseCaseResponse(result: ForgotPasswordResponse): NextResponse {
  return NextResponse.json({
    ok: true,
    message: result.message,
    ...(result._devToken ? { _devToken: result._devToken } : {}),
  });
}
