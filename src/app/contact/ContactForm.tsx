"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { z } from "zod";

type Status = "idle" | "submitting" | "success" | "error";

const schema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد.").max(100),
  email: z.string().email("ایمیل معتبر نیست."),
  subject: z.string().min(3, "موضوع خیلی کوتاهه.").max(150),
  message: z.string().min(20, "پیام باید حداقل ۲۰ حرف باشه.").max(2000),
});

const subjectOptions = [
  "سوال درباره دوره‌ها",
  "مشکل در ثبت‌نام",
  "مشکل در پرداخت",
  "پیشنهاد همکاری",
  "سایر",
];

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: (formData.get("name") as string | null)?.trim() ?? "",
      email: (formData.get("email") as string | null)?.trim() ?? "",
      subject: (formData.get("subject") as string | null)?.trim() ?? "",
      message: (formData.get("message") as string | null)?.trim() ?? "",
    };

    // Client-side validation
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("لطفاً خطاهای فرم رو برطرف کن.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          if (data.fieldErrors) setErrors(data.fieldErrors);
          setMessage(data.error ?? "خطا در ارسال پیام. لطفاً دوباره تلاش کن.");
          return;
        }

        setStatus("success");
        setMessage(data.message ?? "پیام شما با موفقیت ارسال شد. تیم ما ظرف ۲۴ ساعت جواب می‌ده.");
        form.reset();
      } catch {
        setStatus("error");
        setMessage("خطای شبکه. اتصال اینترنتت رو چک کن و دوباره تلاش کن.");
      }
    });
  }

  return (
    <div className="rounded-3xl border border-app-border-subtle bg-surface p-6 sm:p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="size-5 text-kid-coral-600" />
        <h2 className="font-display text-xl font-bold text-fg-primary">
          پیام بگذارید
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="name"
            label="نام و نام‌خانوادگی"
            placeholder="مثلاً: سارا محمدی"
            required
            error={errors.name}
          />
          <Field
            name="email"
            type="email"
            label="ایمیل"
            dir="ltr"
            placeholder="you@example.com"
            required
            error={errors.email}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg-primary">
            موضوع <span className="text-red-500">*</span>
          </label>
          <select
            name="subject"
            required
            defaultValue=""
            className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              errors.subject ? "border-red-400" : "border-app-border"
            }`}
            aria-invalid={!!errors.subject}
          >
            <option value="" disabled>
              انتخاب کنید...
            </option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
          )}
        </div>

        <Field
          name="message"
          label="پیام شما"
          as="textarea"
          rows={6}
          placeholder="سوالت، پیشنهادت یا هر چیزی که دوست داری به ما بگی..."
          required
          error={errors.message}
        />

        {/* Status banner */}
        {status === "success" && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && !Object.keys(errors).length && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              در حال ارسال...
            </>
          ) : (
            <>
              <Send className="size-4" />
              ارسال پیام
            </>
          )}
        </button>

        <p className="text-center text-xs text-fg-muted">
          با ارسال، با <a href="/privacy" className="text-accent hover:underline">سیاست حفظ حریم خصوصی</a> موافقت می‌کنی.
        </p>
      </form>
    </div>
  );
}

interface FieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  rows?: number;
  dir?: "ltr" | "rtl";
  as?: "input" | "textarea";
  error?: string;
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  rows,
  dir,
  as = "input",
  error,
}: FieldProps) {
  const baseClass =
    "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors";
  const borderClass = error ? "border-red-400" : "border-app-border";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-fg-primary">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          name={name}
          rows={rows ?? 4}
          placeholder={placeholder}
          required={required}
          dir={dir}
          className={`${baseClass} ${borderClass} resize-none`}
          aria-invalid={!!error}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          dir={dir}
          className={`${baseClass} ${borderClass}`}
          aria-invalid={!!error}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
