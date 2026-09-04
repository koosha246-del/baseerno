"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // A gateway/proxy error page is not JSON — never trust res.json()
      // to resolve, or the button would stay stuck on "loading" forever.
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        _devToken?: string;
      };

      if (res.ok) {
        setSent(true);
        // The API only returns _devToken outside production. We additionally
        // guard here so the token box can never appear in a production build.
        if (data._devToken && process.env.NODE_ENV !== "production") {
          setDevToken(data._devToken);
        }
      } else {
        setError(data.error ?? "خطایی رخ داد.");
      }
    } catch {
      setError("اتصال به سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
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
            بازیابی رمز عبور
          </h1>
          <p className="mt-1 text-sm text-fg-secondary">
            ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.
          </p>
        </div>

        {!sent ? (
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل *"
                dir="ltr"
                className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full shadow-glow"
              disabled={loading}
            >
              {loading ? (
                "در حال ارسال..."
              ) : (
                <>
                  <Mail className="size-4" />
                  ارسال لینک بازیابی
                </>
              )}
            </Button>

            <div className="mt-4 text-center text-sm text-fg-secondary">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
              >
                <ArrowLeft className="size-4" />
                بازگشت به ورود
              </Link>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-app-border-subtle bg-surface p-6 text-center shadow-lg sm:p-8">
            <CheckCircle className="mx-auto size-12 text-status-success" />
            <h2 className="mt-4 font-display text-lg font-bold text-fg-primary">
              لینک بازیابی ارسال شد
            </h2>
            <p className="mt-2 text-sm text-fg-secondary">
              اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال شده است.
            </p>

            {devToken ? (
              <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft p-3">
                <p className="text-xs font-semibold text-accent">توکن بازیابی (حالت توسعه):</p>
                <p className="mt-1 break-all font-mono text-xs text-fg-primary" dir="ltr">{devToken}</p>
                <Link
                  href={`/reset-password?token=${devToken}`}
                  className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
                >
                  رفتن به صفحه تغییر رمز ←
                </Link>
              </div>
            ) : null}

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
            >
              <ArrowLeft className="size-4" />
              بازگشت به ورود
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
