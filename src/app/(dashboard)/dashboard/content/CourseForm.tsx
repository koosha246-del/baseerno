"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  onCreated?: () => void;
}

export function CourseForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [level, setLevel] = useState("مقدماتی");
  const [category, setCategory] = useState("grammar");
  const [durationHours, setDurationHours] = useState("");
  const [lessons, setLessons] = useState("");
  const [glyph, setGlyph] = useState("📚");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          price: price ? Number(price) : null,
          level,
          category,
          durationHours: Number(durationHours),
          lessons: Number(lessons),
          glyph,
          accent: "blue",
          published: true,
        }),
      });
      if (res.ok) {
        setMsg("دوره با موفقیت ایجاد شد.");
        setTimeout(() => {
          setOpen(false);
          setMsg("");
          onCreated?.();
          window.location.reload();
        }, 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error ?? "خطایی رخ داد.");
      }
    } catch {
      setMsg("اتصال به سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"
      >
        <Plus className="size-4" />
        ایجاد دوره جدید
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">ایجاد دوره جدید</h2>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
          <X className="size-5" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">عنوان دوره</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: گرامر پایه A1"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">زیرعنوان</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="توضیح کوتاه..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="توضیح کامل دوره..."
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">قیمت (تومان)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            dir="ltr"
            placeholder="خالی = رایگان"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">سطح</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="مقدماتی">مقدماتی</option>
            <option value="متوسط">متوسط</option>
            <option value="پیشرفته">پیشرفته</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">دسته‌بندی</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="grammar">گرامر</option>
            <option value="vocabulary">واژگان</option>
            <option value="listening">شنیدن</option>
            <option value="reading">خواندن</option>
            <option value="writing">نوشتن</option>
            <option value="ielts">آیلتس</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">مدت (ساعت)</label>
          <input
            type="number"
            min="1"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            dir="ltr"
            placeholder="مثال: 10"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">تعداد دروس</label>
          <input
            type="number"
            min="1"
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            dir="ltr"
            placeholder="مثال: 20"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">ایموجی</label>
          <input
            type="text"
            value={glyph}
            onChange={(e) => setGlyph(e.target.value)}
            placeholder="📚"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}
      <button
        onClick={handleSubmit}
        disabled={loading || !title || !subtitle || !description || !durationHours || !lessons}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "در حال ایجاد..." : "ایجاد دوره"}
      </button>
    </div>
  );
}
