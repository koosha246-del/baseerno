"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId: string;
  courseId: string;
  enrollmentId: string;
}

/**
 * CertificateButton — issues a certificate for a specific enrollment via
 * POST /api/admin/certificates (teacher-ownership + enrollment-consistency
 * enforced server-side). Idempotent upsert: re-clicking re-touches the
 * same certificate rather than duplicating it.
 */
export function CertificateButton({ userId, courseId, enrollmentId }: Props) {
  const [busy, setBusy] = useState(false);

  async function issue() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId, enrollmentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "صدور گواهی ناموفق بود.");
        return;
      }
      toast.success("گواهی‌نامه صادر شد.", {
        description: "دانشجو نوتیفیکیشن دریافت می‌کند و از صفحه گواهی‌ها می‌تواند دانلودش کند.",
      });
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={issue}
      disabled={busy}
      title="صدور گواهی‌نامه برای این ثبت‌نام"
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:border-accent hover:text-white disabled:opacity-50"
    >
      <Award className="size-3.5" />
      {busy ? "در حال صدور..." : "صدور گواهی"}
    </button>
  );
}
