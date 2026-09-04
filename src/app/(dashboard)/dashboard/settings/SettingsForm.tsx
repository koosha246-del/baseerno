"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { SafeUser } from "@/lib/db/types";
import { FileUpload } from "@/components/shared/FileUpload";

interface Props {
  user: SafeUser;
}

export function SettingsForm({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, bio, avatar }),
      });
      if (res.ok) {
        setMsg("تغییرات با موفقیت ذخیره شد.");
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

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <h2 className="mb-4 text-lg font-bold text-white">اطلاعات پروفایل</h2>
      <div className="mb-4">
        <FileUpload
          label="تصویر پروفایل"
          currentUrl={avatar}
          onUpload={(url) => setAvatar(url)}
          folder="avatars"
          accept="image/*"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">نام و نام‌خانوادگی</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">ایمیل</label>
          <input
            type="email"
            dir="ltr"
            value={user.email}
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">شماره تماس</label>
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxxx"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">بیوگرافی</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="درباره شما..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}
      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        <Save className="size-4" />
        {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </div>
  );
}
