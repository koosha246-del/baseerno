"use client";

import { useState } from "react";
import { Plus, CheckCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface Student {
  id: string;
  name: string;
}

interface Props {
  courses: Course[];
  students: Student[];
}

export function GradeForm({ courses, students }: Props) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [userId, setUserId] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit() {
    setMsg("");
    setLoading(true);
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        courseId,
        score: Number(score),
        feedback: feedback || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg("نمره با موفقیت ثبت شد.");
      setScore("");
      setFeedback("");
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
        ثبت نمره جدید
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">ثبت نمره جدید</h2>
        <button onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white">
          بستن
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">دوره</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="">انتخاب دوره...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">دانشجو</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="">انتخاب دانشجو...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">نمره (۰-۲۰)</label>
          <input
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            dir="ltr"
            placeholder="مثال: 18"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">بازخورد (اختیاری)</label>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="نظر استاد..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}
      <button
        onClick={handleSubmit}
        disabled={loading || !courseId || !userId || !score}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        <CheckCircle className="size-4" />
        {loading ? "در حال ثبت..." : "ثبت نمره"}
      </button>
    </div>
  );
}
