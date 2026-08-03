import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { hashPassword } from "@/lib/auth/password";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد."),
});

async function resetPasswordHandler(req: Request) {
  // CSRF: protect the password reset submission.
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
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const reset = await repository.findValidResetToken(parsed.data.token);
  if (!reset) {
    return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده." }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await repository.updatePassword(reset.userId, newHash);
  await repository.markResetTokenUsed(parsed.data.token);

  return NextResponse.json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد." });
}

/** AUTH: max=5, burst=2 per minute — prevent token brute force. */
export const POST = withRateLimit(resetPasswordHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:reset-password",
});