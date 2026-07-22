import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

async function loginHandler(req: Request) {
  // CSRF: login doesn't need an existing session, but it does set a cookie,
  // so we still verify the request origin to prevent login-CSRF attacks.
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

  const { email, password } = parsed.data;
  const user = await repository.findUserByEmail(email);

  if (!user) {
    return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
  }

  await setSession(user);
  const { passwordHash: _h, ...safe } = user;
  return NextResponse.json({ user: safe });
}

/** AUTH: max=5, burst=2 per minute (sliding window). */
export const POST = withRateLimit(loginHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:login",
});
