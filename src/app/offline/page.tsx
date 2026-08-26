"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { WifiOff, RefreshCw, BookOpen, Library, Home } from "lucide-react";

/**
 * Offline / network-failure page.
 * Auto-retries connection on mount and every 10 seconds, and exposes
 * a manual retry button. Shows the most useful destinations so the
 * visitor has something to do while waiting.
 */
export default function OfflinePage() {
  const [retryCount, setRetryCount] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const tick = () => {
      setChecking(true);
      setRetryCount((c) => c + 1);
      // Re-fetch a tiny static asset to test connectivity.
      fetch("/icon.svg", { cache: "no-store" })
        .then((res) => {
          if (res.ok) {
            window.location.reload();
          }
        })
        .catch(() => {
          /* still offline */
        })
        .finally(() => setChecking(false));
    };
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);

  function handleManualRetry() {
    setChecking(true);
    fetch("/icon.svg", { cache: "no-store" })
      .then((res) => {
        if (res.ok) window.location.reload();
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center bg-background">
      <Container width="narrow" className="py-12">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-kid-sky-200 opacity-50" />
            <div className="relative flex size-20 items-center justify-center rounded-full bg-kid-sky-50">
              <WifiOff className="size-10 text-kid-sky-600" />
            </div>
          </div>

          <h1 className="mt-6 font-display text-2xl font-extrabold text-fg-primary sm:text-3xl">
            اتصال اینترنت قطع است
          </h1>
          <p className="mt-3 max-w-md text-base leading-loose text-fg-secondary">
            نتونستیم به اینترنت وصل بشیم. دوره‌هایت منتظرتن — وقتی برگردی
            آنلاین، همین‌جا می‌بینیشون. هر ۱۰ ثانیه خودکار امتحان می‌کنیم.
          </p>

          <button
            onClick={handleManualRetry}
            disabled={checking}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "در حال بررسی..." : "تلاش مجدد"}
          </button>

          {retryCount > 0 && (
            <p className="mt-3 text-xs text-fg-muted">
              {retryCount} بار امتحان کردیم
            </p>
          )}

          {/* Cached content links */}
          <div className="mt-12 w-full max-w-xl">
            <p className="mb-4 text-sm font-semibold text-fg-secondary">
              فعلاً این‌ها رو ببین (آفلاین هم در دسترسه):
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <OfflineLink href="/" icon={Home} label="صفحه اصلی" />
              <OfflineLink href="/courses" icon={BookOpen} label="دوره‌ها (cached)" />
              <OfflineLink href="/library" icon={Library} label="کتابخانه (cached)" />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function OfflineLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-app-border-subtle bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-kid-sky-200 hover:shadow-sm"
    >
      <Icon className="size-5 text-kid-sky-600" />
      <span className="text-xs font-medium text-fg-primary">{label}</span>
    </Link>
  );
}
