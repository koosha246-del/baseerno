import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { notifyNewMessage } from "@/lib/notifications";
import { CACHE_TAGS } from "@/lib/cache-tags";

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

  // Fire-and-forget; never let a notify failure break the send.
  await notifyNewMessage(parsed.data.receiverId, user.name);

  revalidateTag(CACHE_TAGS.messages);
  revalidateTag(CACHE_TAGS.notifications);
  revalidateTag(CACHE_TAGS.user(parsed.data.receiverId));

  return NextResponse.json({ message }, { status: 201 });
}
