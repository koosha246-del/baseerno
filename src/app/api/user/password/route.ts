import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

const schema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید."),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد."),
});

export async function PATCH(req: Request) {
  // CSRF: password change mutates the authenticated user's credentials.
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const fullUser = await repository.findUserById(user.id);
  if (!fullUser) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }

  const ok = await verifyPassword(parsed.data.currentPassword, fullUser.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "رمز عبور فعلی اشتباه است." }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await repository.updatePassword(user.id, newHash);

  return NextResponse.json({ ok: true });
}
