"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TwoFaStatus {
  enabled: boolean;
  secret?: string;
  otpauthUri?: string;
}

/**
 * TwoFactorForm — TOTP setup for the dashboard settings page.
 *
 * Flow (matches /api/user/2fa):
 *  1. GET  → status + a freshly provisioned secret/QR when not yet enabled
 *  2. User scans the QR (or types the secret) into their authenticator app
 *  3. POST { secret, code } → server verifies the code before persisting
 *  4. Disable requires the current password (re-auth against stolen sessions)
 */
export function TwoFactorForm() {
  const [status, setStatus] = useState<TwoFaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/2fa", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در دریافت وضعیت.");
        setStatus(null);
      } else {
        setStatus(data as TwoFaStatus);
      }
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleEnable() {
    if (!status?.secret) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: status.secret, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "فعال‌سازی ناموفق بود.");
        return;
      }
      toast.success("ورود دومرحله‌ای فعال شد.");
      setCode("");
      await loadStatus();
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/user/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "غیرفعال‌سازی ناموفق بود.");
        return;
      }
      toast.success("ورود دومرحله‌ای غیرفعال شد.");
      setCurrentPassword("");
      await loadStatus();
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!status?.secret) return;
    try {
      await navigator.clipboard.writeText(status.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can select manually
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">ورود دومرحله‌ای (2FA)</h2>
        {status ? (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              status.enabled
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-slate-500/15 text-slate-400"
            }`}
          >
            {status.enabled ? (
              <>
                <ShieldCheck className="size-3.5" />
                فعال
              </>
            ) : (
              <>
                <ShieldOff className="size-3.5" />
                غیرفعال
              </>
            )}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-6 text-sm text-slate-400">
          <span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          در حال دریافت وضعیت...
        </div>
      ) : error && !status ? (
        <p className="py-4 text-sm text-red-400">{error}</p>
      ) : status?.enabled ? (
        /* ── Enabled: disable flow ── */
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-slate-400">
            حساب شما با تأیید دومرحله‌ای محافظت می‌شود. برای غیرفعال‌سازی، رمز
            عبور فعلی را وارد کنید.
          </p>
          <input
            type="password"
            dir="ltr"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="رمز عبور فعلی"
            className="w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            onClick={handleDisable}
            disabled={busy || !currentPassword}
            className="mt-1 flex w-fit items-center gap-2 rounded-lg bg-red-500/15 px-6 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/25 disabled:opacity-50"
          >
            <ShieldOff className="size-4" />
            {busy ? "در حال پردازش..." : "غیرفعال‌سازی"}
          </button>
        </div>
      ) : status?.secret && status.otpauthUri ? (
        /* ── Not enabled: enrollment flow ── */
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0 rounded-xl bg-white p-3">
            <QRCodeSVG value={status.otpauthUri} size={148} level="M" />
          </div>
          <div className="min-w-0 flex-1">
            <ol className="list-inside list-decimal text-sm leading-relaxed text-slate-400">
              <li>اپ Google Authenticator را باز کنید.</li>
              <li>QR مقابل را اسکن کنید یا کلید را دستی وارد کنید.</li>
              <li>کد ۶ رقمی فعلی را زیر وارد و تأیید کنید.</li>
            </ol>
            <button
              type="button"
              onClick={copySecret}
              className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-300 hover:bg-white/10"
              dir="ltr"
              title="کپی کلید"
            >
              {status.secret.slice(0, 4)}••••{status.secret.slice(-4)}
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* Code entry + enable — only during enrollment */}
      {!loading && status && !status.enabled && status.secret ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              dir="ltr"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="کد ۶ رقمی"
              className="w-40 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-white placeholder:text-slate-500 placeholder:tracking-normal focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              onClick={handleEnable}
              disabled={busy || code.length !== 6}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              <ShieldCheck className="size-4" />
              {busy ? "در حال تأیید..." : "فعال‌سازی"}
            </button>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
