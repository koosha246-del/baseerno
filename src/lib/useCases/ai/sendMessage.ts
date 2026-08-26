/**
 * UseCase: Send a message to the AI tutor within a conversation.
 *
 * 1. Validates ownership of the conversation.
 * 2. Builds the LLM context: optional course + active lesson title.
 * 3. Persists the user message, calls the LLM (or mock), persists the
 *    assistant reply, and returns both.
 *
 * Cost/privacy guards live in `src/lib/ai/llm.ts` (200-token cap, no chat
 * content in logs).
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { completeChat, LlmError, type LlmTurn } from "@/lib/ai/llm";
import { incr } from "@/lib/metrics";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "پیام را وارد کنید.")
    .max(2000, "پیام حداکثر ۲۰۰۰ کاراکتر."),
  /** Optional lesson title — grounds the assistant in the active lesson. */
  lessonTitle: z.string().max(200).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface SendMessageContext {
  userId: string;
}

export interface SendMessageError {
  ok: false;
  error: string;
  status: number;
}

export interface SendMessageResult {
  ok: true;
  mocked: boolean;
  userMessage: { id: string; role: string; content: string; createdAt: string };
  assistantMessage: { id: string; role: string; content: string; createdAt: string };
}

export type SendMessageResponse = SendMessageResult | SendMessageError;

/**
 * Build the LLM turn list: system prompt (course/lesson context) + the
 * last N messages of the thread + the new user message.
 */
async function buildTurns(
  conversationId: string,
  courseId: string | null,
  input: SendMessageInput,
): Promise<LlmTurn[]> {
  const course = courseId ? await repository.findCourseById(courseId) : null;

  const history = await repository.listChatMessages(conversationId, { take: 10 });

  const systemParts = [
    "تو دستیار یادگیری «بصیر نو» هستی — پلتفرم آموزش آنلاین زبان انگلیسی برای فارسی‌زبانان.",
    "به فارسی پاسخ بده، مختصر و مفید (حداکثر ۲۰۰ توکن).",
  ];
  if (course) {
    systemParts.push(`زمینه دوره: «${course.title}» — ${course.subtitle}`);
  }
  if (input.lessonTitle) {
    systemParts.push(`دانشجو الان دارد این درس را می‌خواند: «${input.lessonTitle}»`);
  }
  systemParts.push(
    "اگر پاسخ را نمی‌دانی، صادقانه بگو و پیشنهاد بده از چه منبعی استفاده کند.",
  );

  const turns: LlmTurn[] = [{ role: "system", content: systemParts.join("\n") }];
  for (const m of history) {
    if (m.role === "user" || m.role === "assistant") {
      turns.push({ role: m.role, content: m.content });
    }
  }
  // Only add the user message if it's not already in the history
  // (it may have been persisted to DB before buildTurns was called).
  const lastHistoryMsg = history[history.length - 1];
  if (!lastHistoryMsg || lastHistoryMsg.content !== input.content || lastHistoryMsg.role !== "user") {
    turns.push({ role: "user", content: input.content });
  }
  return turns;
}

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
  ctx: SendMessageContext,
): Promise<SendMessageResponse> {
  // Ownership check — students can only continue their own threads.
  const conversation = await repository.findConversationById(conversationId);
  if (!conversation || conversation.userId !== ctx.userId) {
    return { ok: false, error: "گفتگو یافت نشد.", status: 404 };
  }

  // Persist the user turn first.
  const userMessage = await repository.createChatMessage({
    conversationId,
    role: "user",
    content: input.content,
  });

  const turns = await buildTurns(conversationId, conversation.courseId, input);
  let reply: string;
  let mocked = false;
  try {
    const result = await completeChat(turns);
    reply = result.content;
    mocked = result.mocked;
  } catch (err) {
    // Roll back the persisted user turn so a retry doesn't duplicate it.
    await repository.deleteChatMessage(userMessage.id);
    if (err instanceof LlmError) {
      return { ok: false, error: err.message, status: 502 };
    }
    return { ok: false, error: "خطا در دریافت پاسخ از سرویس هوش مصنوعی.", status: 502 };
  }

  // Ops signal: one counter per completed assistant turn (real or mock).
  incr("ai:message");

  const assistantMessage = await repository.createChatMessage({
    conversationId,
    role: "assistant",
    content: reply,
  });

  return {
    ok: true,
    mocked,
    userMessage: {
      id: userMessage.id,
      role: userMessage.role,
      content: userMessage.content,
      createdAt: userMessage.createdAt.toISOString(),
    },
    assistantMessage: {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt.toISOString(),
    },
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: SendMessageResponse): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    mocked: result.mocked,
    userMessage: result.userMessage,
    assistantMessage: result.assistantMessage,
  });
}
