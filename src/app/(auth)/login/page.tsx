"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

type ApiError = { error: string };

/**
 * Resolve ?callbackUrl= to a safe in-app path. The middleware sets this on
 * session-expiry redirects; honouring it returns users to the page they
 * were on. Anything that is not a same-origin absolute path — external URLs
 * and protocol-relative "//evil.com" forms — falls back to /dashboard, so
 * the login page can never be turned into an open redirect.
 */
function safeCallbackUrl(raw: string | null): string {
  const fallback = "/dashboard";
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      const payload: Record<string, string> = { email, password };
      if (requiresTwoFactor) {
        payload.twoFactorCode = twoFactorCode;
      }

      let res: Response;
      try {
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      let data: { user?: unknown; requiresTwoFactor?: boolean } | ApiError = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (res.status === 403 && "requiresTwoFactor" in data && data.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          setError("");
          setLoading(false);
          return;
        }
        setError((data as ApiError).error ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید.");
        return;
      }

      router.push(
        safeCallbackUrl(new URLSearchParams(window.location.search).get("callbackUrl")),
      );
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "اتصال به سرور زمان‌بر شد. دوباره تلاش کنید."
          : "اتصال به سرور برقرار نشد. دوباره تلاش کنید.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle brand aurora background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{ backgroundImage: "var(--aurora)", backgroundSize: "cover" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-xl">
            <GraduationCap className="size-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-fg-primary">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-fg-secondary">ورود به پنل کاربری</p>
        </div>

        {/* Card */}
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

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="login-email" className="sr-only">
              ایمیل
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ایمیل *"
              dir="ltr"
              className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="login-password" className="sr-only">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور *"
                dir="ltr"
                className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 pe-11 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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

          {/* 2FA Code */}
          {requiresTwoFactor ? (
            <div className="mb-6">
              <label htmlFor="login-2fa" className="sr-only">
                کد تأیید دومرحله‌ای
              </label>
              <input
                id="login-2fa"
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="کد تأیید دومرحله‌ای (۶ رقمی) *"
                dir="ltr"
                maxLength={6}
                className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>
          ) : (
            <div className="mb-6" />
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full shadow-glow"
            disabled={loading}
          >
            {loading ? (
              "در حال ورود..."
            ) : (
              <>
                <LogIn className="size-4" />
                ورود
              </>
            )}
          </Button>

          {/* Demo accounts hint — only shown during local development */}
          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-5 rounded-xl border border-accent/20 bg-accent-soft p-3 text-center">
              <p className="text-xs font-semibold text-accent">
                حساب‌های آزمایشی (رمز: 123456) — فقط محیط توسعه
              </p>
              <div className="mt-2 flex flex-col gap-1 text-[0.7rem] text-fg-secondary" dir="ltr">
                <span>student@baseerno.ir</span>
                <span>teacher@baseerno.ir</span>
                <span>admin@baseerno.ir</span>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between text-sm text-fg-secondary">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent hover:underline"
            >
              رمز عبور را فراموش کرده‌اید؟
            </Link>
            <span>
              حساب ندارید؟{" "}
              <Link
                href="/register"
                className="font-semibold text-accent hover:underline"
              >
                ثبت‌نام کنید
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
