import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { siteConfig } from "@/config/site";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("ایمیل معتبر نیست."),
});

async function forgotPasswordHandler(req: Request) {
  // CSRF: prevents triggering password resets for arbitrary emails from a
  // third-party site (a harassment / amplification vector).
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ایمیل معتبر وارد کنید." }, { status: 422 });
  }

  const user = await repository.findUserByEmail(parsed.data.email);

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "اگر ایمیل وجود داشته باشد، لینک بازیابی ارسال شد.",
    });
  }

  const reset = await repository.createPasswordReset(user.id);

  // Send reset email
  const resetUrl = `${siteConfig.url}/reset-password?token=${reset.token}`;
  const emailContent = passwordResetEmail(user.name, resetUrl);
  sendEmail({ to: user.email, ...emailContent }).catch(() => {});

  // Only expose the raw token in non-production so developers can test
  // the reset flow without a configured mail server. Never leak it in prod.
  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    message: "لینک بازیابی رمز عبور به ایمیل شما ارسال شد.",
    ...(isDev ? { _devToken: reset.token } : {}),
  });
}

/** AUTH: max=5, burst=2 per minute. */
export const POST = withRateLimit(forgotPasswordHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:forgot",
});
