"use client";

import { useState, useMemo } from "react";
import { Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function MessagesList({ messages, currentUserId, allUsers }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return messages;
    const q = query.trim().toLowerCase();
    return messages.filter((m) => m.body.toLowerCase().includes(q));
  }, [messages, query]);

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-800/50 p-12 text-center">
        <MessageSquare className="mx-auto size-12 text-slate-600" />
        <p className="mt-4 text-slate-400">هنوز پیامی دریافت نشده.</p>
      </div>
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
                {!isMine && !m.read ? (
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
