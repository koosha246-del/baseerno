/**
 * UseCase: Login a user.
 *
 * Verifies credentials, sets the session cookie, and publishes the
 * `user:login` event.  The route handler stays thin: parse → validate →
 * call use case → respond.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { publish } from "@/lib/events";
import { verifyCode } from "@/lib/security/totp";
import { incr } from "@/lib/metrics";
import { env } from "@/lib/env";
import {
  findDemoAccount,
  demoAccountToSafeUser,
} from "@/lib/auth/demo-users";

export const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
  /** 6-digit TOTP code — required when the user has 2FA enabled. */
  twoFactorCode: z.string().length(6).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface LoginResult {
  ok: true;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface LoginError {
  ok: false;
  error: string;
  status: number;
}

export interface LoginTwoFactorRequired {
  ok: false;
  requiresTwoFactor: true;
  status: 403;
}

export type LoginResponse = LoginResult | LoginError | LoginTwoFactorRequired;

type DbUser = Awaited<ReturnType<typeof repository.findUserByEmail>>;

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
  let user: DbUser = null;
  try {
    user = await repository.findUserByEmail(input.email);
  } catch (err) {
    // DB unreachable. In demo mode we fall back to the built-in demo
    // accounts so the app can be explored without PostgreSQL; otherwise
    // rethrow so the middleware answers 503 "دیتابیس در دسترس نیست".
    if (!env.demoMode) throw err;
  }

  if (!user) {
    // Demo fallback (only reached when demoMode is on and the DB lookup
    // failed or found nothing).
    if (env.demoMode) {
      const demo = findDemoAccount(input.email);
      if (demo && input.password === demo.password) {
        const safeUser = demoAccountToSafeUser(demo);
        await setSession(safeUser);
        await publish({ type: "user:login", userId: demo.id, email: demo.email });
        return {
          ok: true,
          user: {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            role: demo.role,
          },
        };
      }
    }
    incr("auth:failed");
    return { ok: false, error: "ایمیل یا رمز عبور اشتباه است.", status: 401 };
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    incr("auth:failed");
    return { ok: false, error: "ایمیل یا رمز عبور اشتباه است.", status: 401 };
  }

  // 2FA gate: when enabled, the TOTP code is mandatory before a session.
  const twoFactorEnabled =
    (user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false;
  const twoFactorSecret =
    (user as { twoFactorSecret?: string | null }).twoFactorSecret ?? null;

  // Defensive fallback: `enabled && !secret` is an inconsistent row (only
  // reachable via a manual DB edit — the enable handler writes both
  // atomically). Treat it as "no 2FA" so the user is never locked out.
  if (twoFactorEnabled && twoFactorSecret) {
    if (!input.twoFactorCode) {
      return { ok: false, requiresTwoFactor: true, status: 403 };
    }
    if (!verifyCode(twoFactorSecret, input.twoFactorCode)) {
      incr("auth:failed");
      return { ok: false, error: "کد تأیید دومرحله‌ای اشتباه است.", status: 401 };
    }
  }

  // Set session cookie
  await setSession(user);

  // Publish event — no built-in side effects yet, but extensible (e.g.
  // security audit log, login alerts).
  await publish({ type: "user:login", userId: user.id, email: user.email });

  // Whitelist the fields sent to the client — never spread the whole row
  // (that would leak passwordHash, twoFactorSecret, etc.).
  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: LoginResponse): NextResponse {
  if (result.ok) {
    return NextResponse.json({ user: result.user });
  }
  if ("requiresTwoFactor" in result) {
    return NextResponse.json(
      { error: "کد تأیید دومرحله‌ای الزامی است.", requiresTwoFactor: true },
      { status: 403 },
    );
  }
  return NextResponse.json({ error: result.error }, { status: result.status });
}
