import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

const schema = z.object({
  receiverId: z.string().min(1, "گیرنده را مشخص کنید."),
  body: z.string().min(1, "متن پیام را وارد کنید.").max(2000, "پیام حداکثر ۲۰۰۰ کاراکتر."),
});

export async function POST(req: Request) {
  // CSRF: messages are sent as the authenticated user.
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

  const receiver = await repository.findSafeUserById(parsed.data.receiverId);
  if (!receiver) {
    return NextResponse.json({ error: "گیرنده یافت نشد." }, { status: 404 });
  }

  const message = await repository.createMessage({
    senderId: user.id,
    receiverId: parsed.data.receiverId,
    body: parsed.data.body,
  });

  return NextResponse.json({ message }, { status: 201 });
}
