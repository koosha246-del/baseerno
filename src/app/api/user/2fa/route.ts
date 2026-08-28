import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { generateSecret, verifyCode, buildOtpauthUri } from "@/lib/security/totp";
import { verifyPassword } from "@/lib/auth/password";

const enableSchema = z.object({
  secret: z.string().min(16, "سریال نامعتبر است."),
  code: z.string().length(6, "کد باید ۶ رقم باشد."),
});

const disableSchema = z.object({
  /** Current password — re-auth so a stolen session can't strip 2FA. */
  currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید."),
});

/**
 * 2FA (TOTP) setup — ADMIN and TEACHER accounts can self-enroll.
 *
 * Flow:
 *  GET  → returns { enabled, secret?, otpauthUri? } (secret only when not enabled)
 *  POST → verify the code against the claimed secret, then persist it
 *  DEL  → disable 2FA (requires current password in body)
 */
async function getStatusHandler() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const full = await repository.findUserById(user.id);
  const enabled = full?.twoFactorEnabled ?? false;

  // Provision a fresh secret each GET so the QR can be regenerated.
  const secret = enabled ? undefined : generateSecret();

  return NextResponse.json({
    enabled,
    ...(secret
      ? { secret, otpauthUri: buildOtpauthUri(secret, user.email) }
      : {}),
  });
}

async function enableHandler(req: Request) {
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = enableSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // The user must prove they hold the secret before we enable it.
  // verifyCode decodes the secret as base32 and throws on invalid
  // characters — validate the charset first so garbage input is a 422,
  // not an unhandled 500.
  if (!/^[A-Z2-7]+=*$/.test(parsed.data.secret.toUpperCase())) {
    return NextResponse.json(
      { error: "کلید ۲FA نامعتبر است." },
      { status: 422 },
    );
  }
  if (!verifyCode(parsed.data.secret, parsed.data.code)) {
    return NextResponse.json({ error: "کد تأیید نادرست است." }, { status: 400 });
  }

  await repository.updateUser(user.id, {
    twoFactorSecret: parsed.data.secret,
    twoFactorEnabled: true,
  });

  return NextResponse.json({ ok: true, enabled: true });
}

async function disableHandler(req: Request) {
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = disableSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Re-authenticate with the current password before disabling 2FA.
  const full = await repository.findUserById(user.id);
  if (!full) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }
  const ok = await verifyPassword(parsed.data.currentPassword, full.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "رمز عبور فعلی اشتباه است." }, { status: 400 });
  }

  await repository.updateUser(user.id, {
    twoFactorSecret: null,
    twoFactorEnabled: false,
  });

  return NextResponse.json({ ok: true, enabled: false });
}

/** READ preset — status is a cheap read. */
export const GET = withRateLimit(getStatusHandler, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "2fa:status",
});

/** API preset — enabling/disabling mutates the account. */
export const POST = withRateLimit(enableHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "2fa:enable",
});

export const DELETE = withRateLimit(disableHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "2fa:disable",
});
