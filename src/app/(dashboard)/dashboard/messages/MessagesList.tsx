"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  read: boolean;
  sentAt: Date;
}

interface User {
  id: string;
  name: string;
}

interface Props {
  messages: Message[];
  currentUserId: string;
  allUsers: User[];
  /** Optional callback fired when messages are marked as read, so the
   *  parent can re-fetch the canonical state from the server. */
  onReadChange?: (readIds: string[]) => void;
}

export function MessagesList({ messages, currentUserId, allUsers, onReadChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return messages;
    const q = query.trim().toLowerCase();
    return messages.filter((m) => m.body.toLowerCase().includes(q));
  }, [messages, query]);

  /**
   * Mark any newly-rendered unread messages as read.
   *
   * The API is best-effort fire-and-forget so a transient failure
   * doesn't block the UI. The optimistic local set (`readIds`) drives
   * the badge/indicator immediately; the parent's `onReadChange` is
   * notified so it can re-fetch the canonical list if it wants.
   */
  useEffect(() => {
    const unreadReceived = messages.filter(
      (m) => !m.read && m.receiverId === currentUserId && !readIds.has(m.id),
    );
    if (unreadReceived.length === 0) return;

    const ids: string[] = [];
    for (const m of unreadReceived) {
      ids.push(m.id);
      fetch(`/api/messages/${m.id}/read`, { method: "PATCH" }).catch(
        (err) => {
          console.error("[mark read]", m.id, err);
        },
      );
    }
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    onReadChange?.(ids);
    // Refresh the server component so the canonical `read` flag on the
    // message rows catches up to the optimistic local state. Debounced
    // to once per burst of markings.
    const t = window.setTimeout(() => router.refresh(), 800);
    return () => window.clearTimeout(t);
  }, [messages, currentUserId, readIds, onReadChange, router]);

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="هنوز پیامی نیست"
        description="وقتی کسی پیام بفرستد، اینجا می‌بینی."
      />
    );
  }

  return (
    <>
      <div className="relative w-full max-w-xs">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی پیام..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-500">پیامی با این عبارت یافت نشد.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => {
            const isMine = m.senderId === currentUserId;
            const other = allUsers.find((u) => u.id === (isMine ? m.receiverId : m.senderId));
            const isRead = m.read || readIds.has(m.id);
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-4",
                  isMine
                    ? "mr-8 border-accent/20 bg-accent/5"
                    : "ml-8 border-white/10 bg-slate-800/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    {isMine ? "شما" : other?.name ?? "ناشناس"}
                  </span>
                  <span className="text-[0.65rem] text-slate-500">
                    {new Date(m.sentAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{m.body}</p>
                {!isMine && !isRead ? (
                  <span className="mt-1 w-fit rounded-full bg-accent px-2 py-0.5 text-[0.6rem] font-bold text-white">
                    جدید
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
