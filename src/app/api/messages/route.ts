import { NextResponse } from "next/server";
import {
  sendMessage,
  sendMessageSchema,
  buildUseCaseResponse,
} from "@/lib/useCases/messages/sendMessage";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function sendMessageHandler(req: Request) {
  // CSRF: messages are sent as the authenticated user.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  // Validate
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Execute business logic
  const result = await sendMessage({
    ...parsed.data,
    senderId: user.id,
    senderName: user.name,
  });
  return buildUseCaseResponse(result);
}

/** API: max=20, burst=5 per minute. */
export const POST = withRateLimit(sendMessageHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "messages:send",
});
