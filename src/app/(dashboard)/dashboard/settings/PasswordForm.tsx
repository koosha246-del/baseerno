"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  async function handleChange() {
    setMsg("");
    setError(false);
    setLoading(true);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      setMsg("رمز عبور با موفقیت تغییر کرد.");
      setError(false);
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setMsg(data.error ?? "خطایی رخ داد.");
      setError(true);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <h2 className="mb-4 text-lg font-bold text-white">تغییر رمز عبور</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">رمز عبور فعلی</label>
          <input
            type="password"
            dir="ltr"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">رمز عبور جدید</label>
          <input
            type="password"
            dir="ltr"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="حداقل ۶ کاراکتر"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>
      {msg ? (
        <p className={`mt-3 text-sm ${error ? "text-red-400" : "text-emerald-400"}`}>{msg}</p>
      ) : null}
      <button
        onClick={handleChange}
        disabled={loading}
        className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
      >
        <KeyRound className="size-4" />
        {loading ? "در حال به‌روزرسانی..." : "به‌روزرسانی رمز"}
      </button>
    </div>
  );
}
