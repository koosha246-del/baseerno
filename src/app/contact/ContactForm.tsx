"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "خطا در ارسال پیام.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "پیام شما ارسال شد.");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
      setMessage("خطای شبکه. لطفاً دوباره تلاش کنید.");
    }
  }

  return (
    <div className="rounded-2xl border border-app-border-subtle bg-surface p-6 sm:p-8">
      <h2 className="mb-6 font-display text-xl font-bold text-fg-primary">
        پیام بگذارید
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="name"
            placeholder="نام و نام‌خانوادگی"
            required
            error={errors.name}
          />
          <Field
            name="email"
            type="email"
            dir="ltr"
            placeholder="ایمیل"
            required
            error={errors.email}
          />
        </div>
        <Field
          name="subject"
          placeholder="موضوع"
          required
          error={errors.subject}
        />
        <Field
          name="message"
          as="textarea"
          rows={5}
          placeholder="پیام شما..."
          required
          error={errors.message}
        />

        {status === "success" && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {status === "submitting" ? "در حال ارسال..." : "ارسال پیام"}
        </button>
      </form>
    </div>
  );
}

interface FieldProps {
  name: string;
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
  placeholder,
  type = "text",
  required,
  rows,
  dir,
  as = "input",
  error,
}: FieldProps) {
  const className =
    "w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  if (as === "textarea") {
    return (
      <textarea
        name={name}
        rows={rows ?? 4}
        placeholder={placeholder}
        required={required}
        className={`${className} resize-none`}
        aria-invalid={!!error}
      />
    );
  }
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      dir={dir}
      className={className}
      aria-invalid={!!error}
    />
  );
}
