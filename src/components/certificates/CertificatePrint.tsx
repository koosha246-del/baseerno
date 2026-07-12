"use client";

import { Printer } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

interface CertificatePrintProps {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  issueDate: Date;
  durationHours: number;
  mentorName: string;
}

export function CertificatePrint({
  studentName,
  courseTitle,
  certificateNumber,
  issueDate,
  durationHours,
  mentorName,
}: CertificatePrintProps) {
  const dateStr = toPersianDigits(
    new Date(issueDate).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  return (
    <>
      {/* Print button — hidden in print */}
      <div className="print:hidden fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-900/95 px-6 py-3 backdrop-blur">
        <h1 className="text-sm font-bold text-white">پیش‌نمایش گواهی‌نامه</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
          >
            <Printer className="size-4" />
            چاپ / ذخیره PDF
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
            بازگشت
          </button>
        </div>
      </div>

      {/* Certificate — A4 landscape, print-optimized */}
      <div
        className="print:m-0 mx-auto my-12 flex print:my-0 items-center justify-center bg-slate-200 p-8 print:bg-white print:p-0"
        style={{ direction: "rtl" }}
      >
        <div
          className="relative overflow-hidden bg-white shadow-2xl print:shadow-none"
          style={{
            width: "297mm",
            maxWidth: "100%",
            height: "210mm",
            aspectRatio: "297 / 210",
            fontFamily: "Vazirmatn, Tahoma, sans-serif",
          }}
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #D4A017 100%)",
              opacity: 0.08,
            }}
          />

          {/* Decorative borders */}
          <div className="absolute inset-4 rounded-2xl border-4 border-double border-amber-500/40" />
          <div className="absolute inset-8 rounded-xl border border-amber-500/20" />

          {/* Corner ornaments */}
          {[
            "top-12 right-12",
            "top-12 left-12",
            "bottom-12 right-12",
            "bottom-12 left-12",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} size-12 rounded-full border-2 border-amber-500/30`}
            />
          ))}

          {/* Content */}
          <div className="relative flex h-full flex-col items-center justify-between p-16 text-center">
            {/* Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-amber-500 text-3xl font-black text-white shadow-lg">
                🎓
              </div>
              <h1
                className="text-3xl font-black tracking-tight"
                style={{ color: "#1E3A5F" }}
              >
                گواهی‌نامه پایان دوره
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Certificate of Completion
              </p>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center gap-6">
              <p className="text-base text-slate-600">این گواهی‌نامه به</p>

              <h2
                className="text-5xl font-black"
                style={{
                  background:
                    "linear-gradient(90deg, #1E3A5F 0%, #2563EB 50%, #D4A017 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {studentName}
              </h2>

              <p className="max-w-2xl text-base leading-loose text-slate-600">
                مبنی بر گذراندن موفقیت‌آمیز دوره‌ی
              </p>

              <h3
                className="text-2xl font-extrabold"
                style={{ color: "#2563EB" }}
              >
                «{courseTitle}»
              </h3>

              <p className="text-sm text-slate-500">
                به مدت {toPersianDigits(durationHours)} ساعت آموزش تخصصی
              </p>
            </div>

            {/* Footer */}
            <div className="flex w-full items-end justify-between px-8">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-px w-40"
                  style={{ background: "#1E3A5F" }}
                />
                <p className="text-xs font-bold text-slate-700">
                  استاد دوره: {mentorName}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full px-6 py-2 text-xs font-black text-white shadow-md"
                  style={{
                    background:
                      "linear-gradient(90deg, #1E3A5F 0%, #2563EB 100%)",
                  }}
                >
                  شماره گواهی‌نامه
                </div>
                <p
                  className="font-mono text-lg font-black"
                  style={{ color: "#1E3A5F" }}
                  dir="ltr"
                >
                  {certificateNumber}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-bold text-slate-700">{dateStr}</p>
                <div
                  className="h-px w-40"
                  style={{ background: "#1E3A5F" }}
                />
                <p className="text-xs text-slate-500">تاریخ صدور</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}
