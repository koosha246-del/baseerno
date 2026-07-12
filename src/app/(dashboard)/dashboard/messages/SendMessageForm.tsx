"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";

interface User {
  id: string;
  name: string;
}

interface Props {
  currentUserId: string;
  allUsers: User[];
}

export function SendMessageForm({ currentUserId, allUsers }: Props) {
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const otherUsers = allUsers.filter((u) => u.id !== currentUserId);

  async function handleSend() {
    setMsg("");
    setLoading(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, body }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg("پیام با موفقیت ارسال شد.");
      setBody("");
      setReceiverId("");
      setTimeout(() => { setOpen(false); setMsg(""); }, 1500);
    } else {
      const data = await res.json();
      setMsg(data.error ?? "خطایی رخ داد.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"
      >
        <Send className="size-4" />
        ارسال پیام
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">ارسال پیام جدید</h2>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
          <X className="size-5" />
        </button>
      </div>
      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">گیرنده</label>
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="">انتخاب گیرنده...</option>
            {otherUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">متن پیام</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="متن پیام خود را بنویسید..."
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}
      <button
        onClick={handleSend}
        disabled={loading || !receiverId || !body.trim()}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        <Send className="size-4" />
        {loading ? "در حال ارسال..." : "ارسال"}
      </button>
    </div>
  );
}
