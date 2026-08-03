"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatWidgetProps {
  /** Active course id — grounds the AI in the course context. */
  courseId?: string;
  /** Active lesson title — passed with each message. */
  lessonTitle?: string;
}

/**
 * Floating AI tutor chat. Local state + simple polling — no WebSocket.
 * Works without an AI_API_KEY (the backend returns a mock Persian reply).
 */
export function ChatWidget({ courseId, lessonTitle }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mocked, setMocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /** Ensure a conversation exists before sending. */
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    const res = await fetch("/api/ai/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "خطا در شروع گفتگو.");
      return null;
    }
    setConversationId(data.conversation.id);
    return data.conversation.id as string;
  }, [conversationId, courseId]);

  /** Poll message history (simple polling, no WebSocket). */
  const refreshHistory = useCallback(async () => {
    if (!conversationId) return;
    const res = await fetch(`/api/ai/conversations/${conversationId}/messages`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.messages)) {
      setMessages(data.messages);
      setError(null);
    }
  }, [conversationId]);

  // Open the panel → create conversation + load history.
  useEffect(() => {
    if (!open || initializedRef.current) return;
    initializedRef.current = true;
    void (async () => {
      const id = await ensureConversation();
      if (id) {
        const res = await fetch(`/api/ai/conversations/${id}/messages`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.messages)) setMessages(data.messages);
      }
    })();
  }, [open, ensureConversation]);

  // Simple polling while open (keeps the thread fresh across tabs).
  useEffect(() => {
    if (!open || !conversationId) return;
    const t = setInterval(() => void refreshHistory(), 8000);
    return () => clearInterval(t);
  }, [open, conversationId, refreshHistory]);

  // Autoscroll to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const id = await ensureConversation();
    if (!id) return;

    setSending(true);
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/ai/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, lessonTitle }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "خطا در ارسال پیام.");
        // Roll back the optimistic message on failure.
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
        setInput(text);
        return;
      }

      setMocked(Boolean(data.mocked));
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"));
        return [
          ...withoutTemp,
          {
            id: data.userMessage.id,
            role: "user",
            content: data.userMessage.content,
            createdAt: data.userMessage.createdAt,
          },
          {
            id: data.assistantMessage.id,
            role: "assistant",
            content: data.assistantMessage.content,
            createdAt: data.assistantMessage.createdAt,
          },
        ];
      });
    } catch {
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "بستن دستیار هوشمند" : "باز کردن دستیار هوشمند"}
        className={cn(
          "fixed bottom-5 left-5 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95",
          open ? "bg-surface text-fg-secondary" : "bg-accent text-white",
        )}
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>

      {/* Chat panel */}
      {open ? (
        <div
          dir="rtl"
          className="fixed bottom-24 left-5 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-app-border-subtle bg-surface shadow-2xl sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-app-border-subtle bg-surface-muted px-4 py-3">
            <Bot className="size-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-fg-primary">دستیار هوشمند</span>
              <span className="text-xs text-fg-secondary">
                {mocked ? "حالت آزمایشی (بدون اتصال به مدل)" : "در خدمت یادگیری شما"}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && !sending ? (
              <p className="pt-8 text-center text-sm text-fg-secondary">
                سلام! من دستیار یادگیری شما هستم. درباره این درس سؤال بپرسید. 👋
              </p>
            ) : null}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "mr-auto bg-accent text-white"
                    : "ml-auto bg-surface-muted text-fg-primary",
                )}
              >
                {m.content}
              </div>
            ))}

            {sending ? (
              <div className="ml-auto flex w-fit items-center gap-2 rounded-2xl bg-surface-muted px-3 py-2 text-sm text-fg-secondary">
                <Loader2 className="size-4 animate-spin" />
                در حال نوشتن…
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
                {error}
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 border-t border-app-border-subtle p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سؤال خود را بنویسید…"
              aria-label="پیام به دستیار"
              className="min-w-0 flex-1 rounded-xl border border-app-border-subtle bg-surface-muted px-3 py-2 text-sm text-fg-primary outline-none placeholder:text-fg-secondary focus:border-accent"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="ارسال پیام"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
