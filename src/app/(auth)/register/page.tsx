"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

type ApiError = { error: string };

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      let res: Response;
      try {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      // Parse defensively — a non-JSON body must never throw here, or the
      // button would stay stuck on "در حال ثبت‌نام".
      let data: { user?: unknown } | ApiError = {};
      try {
        data = (await res.json()) as { user?: unknown } | ApiError;
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError((data as ApiError).error ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید.");
        return;
      }

      router.push("/dashboard");
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
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{ backgroundImage: "var(--aurora)", backgroundSize: "cover" }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-xl">
            <GraduationCap className="size-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-fg-primary">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-fg-secondary">ایجاد حساب کاربری</p>
        </div>

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

          <div className="mb-4">
            <label htmlFor="register-name" className="sr-only">
              نام و نام‌خانوادگی
            </label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام و نام‌خانوادگی *"
              className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="register-email" className="sr-only">
              ایمیل
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ایمیل *"
              dir="ltr"
              className="w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="register-password" className="sr-only">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور * (حداقل ۶ کاراکتر)"
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

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full shadow-glow"
            disabled={loading}
          >
            {loading ? (
              "در حال ثبت‌نام..."
            ) : (
              <>
                <UserPlus className="size-4" />
                ثبت‌نام
              </>
            )}
          </Button>

          <div className="mt-4 text-center text-sm text-fg-secondary">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link
              href="/login"
              className="font-semibold text-accent hover:underline"
            >
              وارد شوید
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
