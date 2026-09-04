import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { hashResetToken } from "@/lib/db/domains/users.repo";
import { prisma } from "@/lib/db/prisma-client";
import { hashPassword } from "@/lib/auth/password";
import { clearSession } from "@/lib/auth/session";
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

  // Atomic + race-safe: the token is claimed INSIDE the transaction via a
  // conditional updateMany (`used: false` AND not yet expired) — two
  // concurrent requests with the same token can't both succeed; the loser
  // gets count=0 and 400. The expiresAt re-check closes the check-then-act
  // gap where a token could expire between the lookup and the claim.
  const newHash = await hashPassword(parsed.data.newPassword);
  const claimed = await prisma.$transaction(async (tx) => {
    const claim = await tx.passwordReset.updateMany({
      where: {
        token: hashResetToken(parsed.data.token),
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });
    if (claim.count === 0) return false;
    // Burn every other outstanding reset token for this user — an older
    // leaked token must not be able to re-reset the fresh password.
    await tx.passwordReset.updateMany({
      where: { userId: reset.userId, used: false },
      data: { used: true },
    });
    await tx.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
    });
    return true;
  });

  if (!claimed) {
    return NextResponse.json({ error: "توکن نامعتبر یا قبلاً استفاده شده." }, { status: 400 });
  }

  // Revoke any existing sessions (tokenVersion bumped above).
  await clearSession();

  return NextResponse.json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد." });
}

/** AUTH: max=5, burst=2 per minute — prevent token brute force. */
export const POST = withRateLimit(resetPasswordHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:reset-password",
});