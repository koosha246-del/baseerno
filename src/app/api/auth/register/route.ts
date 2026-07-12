import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/db/repository";
import { hashPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

const schema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد."),
  email: z.string().email("ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد."),
  role: z.literal("STUDENT").default("STUDENT"),
});

export async function POST(req: Request) {
  // CSRF: register sets a session cookie, so verify origin.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const clientId = getClientIdentifier(req);
  const limit = checkRateLimit(`register:${clientId}`, { windowMs: 60_000, max: 3 });
  if (!limit.success) {
    return NextResponse.json(
      { error: `تعداد تلاش‌ها بیش از حد مجاز. ${limit.retryAfter} ثانیه دیگر تلاش کنید.` },
      { status: 429 }
    );
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

  const { name, email, password, role } = parsed.data;

  const existing = await repository.findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await repository.createUser({ name, email, passwordHash, role });
  await setSession(user);

  // Send welcome email (fire-and-forget)
  const emailContent = welcomeEmail(name);
  sendEmail({ to: email, ...emailContent }).catch(() => {});

  return NextResponse.json({ user });
}
