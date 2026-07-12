"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "bayan-cookie-consent";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Consent | null;
    setConsent(stored);
  }, []);

  if (!mounted || consent) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setConsent("rejected");
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl p-4 sm:bottom-4 sm:left-4 sm:right-auto"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-app-border-subtle bg-surface/95 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Cookie className="size-5" />
          </div>
          <div className="flex-1">
            <h2 id="cookie-title" className="font-bold text-fg-primary">
              ما از کوکی استفاده می‌کنیم
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
              برای بهبود تجربه شما و تحلیل ترافیک، از کوکی استفاده می‌کنیم. با کلیک
              روی «پذیرش» موافقت خود را اعلام می‌کنید.{" "}
              <Link
                href="/privacy"
                className="font-bold text-accent underline-offset-2 hover:underline"
              >
                سیاست حریم خصوصی
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-app-border bg-surface px-4 py-2 text-sm font-medium text-fg-secondary hover:bg-surface-muted"
          >
            فقط ضروری
          </button>
          <button
            type="button"
            onClick={accept}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90"
          >
            پذیرش همه
          </button>
        </div>
      </div>
    </div>
  );
}
