/**
 * AI Tutor — minimal LLM client (OpenAI-compatible chat completions).
 *
 * Hard constraints:
 *  - Cost: assistant responses are capped at MAX_TOKENS (200).
 *  - Privacy: user chat content is NEVER written to logs. Errors log only
 *    the HTTP status / a generic message.
 *  - Offline/dev: when `AI_API_KEY` is absent, a canned Persian response is
 *    returned so the whole flow works without any external service.
 *
 * No SDK dependency — plain `fetch` against an OpenAI-compatible endpoint
 * (`AI_BASE_URL`, default https://api.openai.com/v1).
 */

import { env } from "@/lib/env";

/** Response token budget per assistant turn (cost control). */
export const MAX_TOKENS = 200;

export interface LlmTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmResult {
  content: string;
  /** True when the response came from the mock (no API key configured). */
  mocked: boolean;
}

/** Whether a real LLM is configured. */
export function isAiEnabled(): boolean {
  return Boolean(env.AI_API_KEY?.trim());
}

const MOCK_REPLIES = [
  "سلام! من دستیار یادگیری بصیر‌نو هستم. دربارهٔ همین درس یا دوره از من بپرس — می‌توانم نکته‌ها را خلاصه کنم، مثال بزنم و تمرین پیشنهاد بدهم. 📚",
  "سؤال خوبی است! اگر بخشی از ویدیو را متوجه نشدی، بگو از کجا — می‌توانم همان بخش را با مثال ساده‌تر توضیح بدهم.",
  "برای تثبیت این مبحث، پیشنهاد می‌کنم ابتدا مفاهیم اصلی را با زبان خودت خلاصه کنی، سپس تمرین کنی. اگر بخواهی یک تمرین کوتاه طراحی می‌کنم. ✍️",
  "این نکته در ادامهٔ دوره هم به کارت می‌آید. نکتهٔ کلیدی: مفاهیم جدید را به چیزهایی که از قبل می‌دانی وصل کن — این‌طوری ماندگارتر می‌شوند.",
  "دست‌یار در حالت آزمایشی بدون اتصال به مدل زبانی پاسخ می‌دهد. برای پاسخ‌های کامل‌تر، کلید API را در متغیر محیطی AI_API_KEY تنظیم کنید.",
];

function pickMockReply(seed: string): string {
  let hash = 0;
  for (const ch of seed) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return MOCK_REPLIES[hash % MOCK_REPLIES.length] ?? MOCK_REPLIES[0]!;
}

/**
 * Send the conversation turns to the LLM and return the assistant reply.
 *
 * Never throws with chat content in the message; callers get either a
 * Persian error via `LlmError` or the mock/content result.
 */
export async function completeChat(turns: LlmTurn[]): Promise<LlmResult> {
  const apiKey = env.AI_API_KEY?.trim();
  if (!apiKey) {
    const lastUser = [...turns].reverse().find((t) => t.role === "user")?.content ?? "x";
    return { content: pickMockReply(lastUser), mocked: true };
  }

  const baseUrl = (env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = env.AI_MODEL ?? "gpt-4o-mini";

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: turns,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
      }),
      cache: "no-store",
    });
  } catch {
    // Network failure — log only the generic fact, never the content.
    console.error("[ai] LLM request failed (network).");
    throw new LlmError("خطا در اتصال به سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.");
  }

  if (!res.ok) {
    // Do NOT log the body — it may echo user content.
    console.error(`[ai] LLM request failed (HTTP ${res.status}).`);
    if (res.status === 429) {
      throw new LlmError("سرویس هوش مصنوعی شلوغ است. کمی بعد دوباره تلاش کنید.");
    }
    throw new LlmError("خطا در دریافت پاسخ از سرویس هوش مصنوعی.");
  }

  let json: { choices?: Array<{ message?: { content?: string } }> };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new LlmError("پاسخ نامعتبر از سرویس هوش مصنوعی دریافت شد.");
  }

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new LlmError("پاسخی از سرویس هوش مصنوعی دریافت نشد.");
  }

  return { content, mocked: false };
}

/** Domain error with a Persian user-facing message. */
export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}
