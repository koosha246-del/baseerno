"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  courseId: string;
}

export function LessonForm({ courseId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("video");
  const [duration, setDuration] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit() {
    setMsg("");
    setLoading(true);
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        title,
        type,
        durationMinutes: Number(duration),
        isFree,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg("درس با موفقیت اضافه شد.");
      setTitle("");
      setDuration("");
      setTimeout(() => { setOpen(false); setMsg(""); window.location.reload(); }, 1000);
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
        <Plus className="size-4" />
        افزودن درس
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">افزودن درس جدید</h2>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
          <X className="size-5" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">عنوان درس</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: مقدمه دوره"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">نوع</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="video">ویدیو</option>
            <option value="assignment">تکلیف</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">مدت (دقیقه)</label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            dir="ltr"
            placeholder="مثال: 15"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFree"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="size-4 rounded border-white/10 bg-white/5"
          />
          <label htmlFor="isFree" className="text-sm text-slate-300">رایگان</label>
        </div>
      </div>
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}
      <button
        onClick={handleSubmit}
        disabled={loading || !title || !duration}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "در حال ثبت..." : "افزودن درس"}
      </button>
    </div>
  );
}
