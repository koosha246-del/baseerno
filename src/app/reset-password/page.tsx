"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      setError(data.error ?? "خطایی رخ داد.");
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-fg-secondary">توکن بازیابی یافت نشد.</p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          >
            <ArrowLeft className="size-4" />
            درخواست لینک بازیابی جدید
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{ backgroundImage: "var(--aurora)", backgroundSize: "cover" }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-xl">
            <KeyRound className="size-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-fg-primary">
            تغییر رمز عبور
          </h1>
          <p className="mt-1 text-sm text-fg-secondary">رمز عبور جدید خود را وارد کنید.</p>
        </div>

        {!success ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-app-border-subtle bg-surface p-6 shadow-lg sm:p-8"
            noValidate
          >
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mb-6">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="رمز عبور جدید (حداقل ۶ کاراکتر) *"
                  dir="ltr"
                  className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 pe-11 text-sm text-fg-primary transition-colors placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 left-3 flex items-center text-fg-muted hover:text-fg-primary"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full shadow-glow"
              disabled={loading}
            >
              {loading ? "در حال تغییر..." : "تغییر رمز عبور"}
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl border border-app-border-subtle bg-surface p-6 text-center shadow-lg sm:p-8">
            <CheckCircle className="mx-auto size-12 text-status-success" />
            <h2 className="mt-4 font-display text-lg font-bold text-fg-primary">
              رمز عبور تغییر کرد
            </h2>
            <p className="mt-2 text-sm text-fg-secondary">
              اکنون می‌توانید با رمز جدید وارد شوید.
            </p>
            <Button asChild variant="brand" size="lg" className="mt-6">
              <Link href="/login">ورود به حساب</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
