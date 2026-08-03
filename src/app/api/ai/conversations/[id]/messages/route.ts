import { NextResponse } from "next/server";
import {
  sendMessage,
  sendMessageSchema,
  buildUseCaseResponse,
} from "@/lib/useCases/ai/sendMessage";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

/** Shared ownership check — only the conversation owner may read/write. */
async function ownedConversationId(userId: string, rawId: string): Promise<string | null> {
  const conversation = await repository.findConversationById(rawId);
  if (!conversation || conversation.userId !== userId) return null;
  return conversation.id;
}

async function getHistoryHandler(req: Request, { params }: RouteContext) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const conversationId = await ownedConversationId(user.id, id);
  if (!conversationId) {
    return NextResponse.json({ error: "گفتگو یافت نشد." }, { status: 404 });
  }

  const messages = await repository.listChatMessages(conversationId, { take: 50 });
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

async function sendMessageHandler(req: Request, { params }: RouteContext) {
  // CSRF: sends a message as the logged-in student (costs money).
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const conversationId = await ownedConversationId(user.id, id);
  if (!conversationId) {
    return NextResponse.json({ error: "گفتگو یافت نشد." }, { status: 404 });
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
  const result = await sendMessage(conversationId, parsed.data, { userId: user.id });
  return buildUseCaseResponse(result);
}

/** READ: max=60, burst=10 — history polling. */
export const GET = withRateLimit(getHistoryHandler, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "ai:history",
});

/**
 * SENSITIVE: max=3, burst=1 per 2 minutes — every message costs money.
 */
export const POST = withRateLimit(sendMessageHandler, RATE_LIMIT_PRESETS.SENSITIVE, {
  keyPrefix: "ai:send",
});
