"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  Loader2,
  Instagram,
  PartyPopper,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** تبدیل ارقام فارسی/عربی به لاتین — قبل از اعتبارسنجی */
function normalizeDigits(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const fi = fa.indexOf(d);
    if (fi > -1) return String(fi);
    return String(ar.indexOf(d));
  });
}

const formSchema = z.object({
  parentName: z
    .string()
    .trim()
    .min(3, "نام والد باید حداقل ۳ حرف باشد.")
    .max(60, "نام واردشده بیش از حد طولانی است."),
  studentName: z
    .string()
    .trim()
    .min(2, "نام زبان‌آموز باید حداقل ۲ حرف باشد.")
    .max(60, "نام واردشده بیش از حد طولانی است."),
  ageGroup: z.enum(["kids", "teens"], {
    message: "یک گروه سنی را انتخاب کنید.",
  }),
  phone: z
    .string()
    .trim()
    .transform(normalizeDigits)
    .pipe(
      z
        .string()
        .regex(/^09\d{9}$/, "شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.")
    ),
  note: z.string().trim().max(500, "توضیحات بیش از حد طولانی است.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ageOptions = [
  { value: "kids", label: "کودکان", hint: "شروع و ساخت پایه" },
  { value: "teens", label: "نوجوانان", hint: "تقویت و پیشرفت" },
] as const;

/**
 * CTA اصلی — فرم واقعی درخواست تعیین سطح و ثبت‌نام
 *
 * نکته: بازخورد فرم با پیام درون‌خطی (inline) داده می‌شود نه toast —
 * چون radix <Toaster> در React 19 استریم reveal را می‌شکند و کل
 * صفحه‌ی اصلی را خالی نشان می‌دهد.
 */
export function FinalCta() {
  const [submitted, setSubmitted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { parentName: "", studentName: "", phone: "", note: "" },
  });

  const selectedGroup = watch("ageGroup");

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setFeedback({
          kind: "error",
          // CSRF/500 paths return { error }, the 422 path { message } —
          // read both so the real cause reaches the user.
          message: data.message ?? data.error ?? "لطفاً دوباره تلاش کنید.",
        });
        return;
      }

      setSubmitted(true);
      setFeedback({
        kind: "success",
        message: "درخواست شما ثبت شد؛ برای هماهنگی تعیین سطح، با شما تماس می‌گیریم.",
      });
      reset();
    } catch {
      setFeedback({
        kind: "error",
        message: "خطای ارتباط با سرور — اتصال اینترنت را بررسی کنید.",
      });
    }
  };

  return (
    <section
      id="register"
      aria-labelledby="register-title"
      className="relative overflow-hidden bg-brand py-20 md:py-28"
    >
      <div aria-hidden="true" className="bg-dots-light absolute inset-0 opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── متن دعوت ────────────────────────── */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-sun" />
              شروع کنید
            </span>

            <h2
              id="register-title"
              className="mt-6 text-3xl font-black leading-[1.3] tracking-tight text-white md:text-[2.6rem] md:leading-[1.28]"
            >
              مسیر یادگیری زبان از همین‌جا شروع می‌شود.
            </h2>

            <p className="mt-5 max-w-md text-base leading-9 text-blue-100/90 md:text-lg">
              سطح مناسب را پیدا کنید و اولین قدم را بردارید؛ کافی است فرم را
              تکمیل کنید تا برای هماهنگی تعیین سطح با شما تماس بگیریم.
            </p>

            <ul className="mt-8 space-y-3 text-[15px] font-semibold text-blue-50">
              {[
                "تعیین سطح پیش از شروع دوره",
                "انتخاب مسیر متناسب با گروه سنی",
                "هماهنگی سریع برای شروع کلاس",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="size-5 text-sun" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-9 flex flex-wrap items-center gap-2 text-sm font-medium text-blue-100/80">
              یا در اینستاگرام پیام بدهید:
              <a
                href={siteConfig.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 font-bold text-white transition-colors hover:bg-white/20"
              >
                <Instagram aria-hidden="true" className="size-4" />
                @{siteConfig.contact.instagramHandle}
              </a>
            </p>
          </div>

          {/* ── کارت فرم ────────────────────────── */}
          <div className="rounded-[28px] bg-white p-6 shadow-2xl shadow-navy/30 sm:p-8 md:p-10">
            {submitted ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="flex size-20 items-center justify-center rounded-full bg-leaf-soft">
                  <PartyPopper aria-hidden="true" className="size-10 text-leaf" />
                </span>
                <h3 className="mt-6 text-2xl font-extrabold text-navy">
                  درخواست شما ثبت شد!
                </h3>
                <p className="mt-3 max-w-xs text-[15px] leading-8 text-ink-soft">
                  ممنون از اعتمادتان. به‌زودی برای هماهنگی تعیین سطح، با شما
                  تماس می‌گیریم.
                </p>
                <Button
                  variant="outline-navy"
                  size="lg"
                  className="mt-8"
                  onClick={() => {
                    setSubmitted(false);
                    // Clear the stale success banner — otherwise the green
                    // "ثبت شد" message reappears over an empty form (and is
                    // re-announced to screen readers via role="status").
                    setFeedback(null);
                  }}
                >
                  ثبت درخواست جدید
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <h3 className="text-xl font-extrabold text-navy md:text-2xl">
                  درخواست تعیین سطح و ثبت‌نام
                </h3>
                <p className="mt-2 text-sm leading-7 text-ink-soft">
                  چند اطلاعات کوتاه؛ بقیه‌اش با ما.
                </p>

                <div className="mt-7 grid gap-5">
                  {/* گروه سنی — انتخاب دکمه‌ای */}
                  <div>
                    <Label className="text-sm font-bold text-ink">
                      زبان‌آموز شما در کدام گروه است؟
                    </Label>
                    <div
                      role="radiogroup"
                      aria-label="انتخاب گروه سنی"
                      className="mt-2.5 grid grid-cols-2 gap-3"
                    >
                      {ageOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex cursor-pointer flex-col items-center rounded-2xl border-2 px-4 py-3.5 text-center transition-all duration-200",
                            selectedGroup === opt.value
                              ? "border-brand bg-brand-tint shadow-sm"
                              : "border-navy/10 bg-white hover:border-brand/40"
                          )}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            {...register("ageGroup")}
                            className="sr-only"
                          />
                          <span
                            className={cn(
                              "text-base font-extrabold",
                              selectedGroup === opt.value
                                ? "text-brand"
                                : "text-navy"
                            )}
                          >
                            {opt.label}
                          </span>
                          <span className="mt-0.5 text-xs font-medium text-ink-soft">
                            {opt.hint}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.ageGroup && (
                      <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                        {errors.ageGroup.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="parentName" className="text-sm font-bold text-ink">
                        نام والد
                      </Label>
                      <Input
                        id="parentName"
                        placeholder="مثلاً: سارا محمدی"
                        autoComplete="name"
                        className="mt-2 h-12 rounded-xl"
                        {...register("parentName")}
                      />
                      {errors.parentName && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                          {errors.parentName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="studentName" className="text-sm font-bold text-ink">
                        نام زبان‌آموز
                      </Label>
                      <Input
                        id="studentName"
                        placeholder="مثلاً: علی"
                        className="mt-2 h-12 rounded-xl"
                        {...register("studentName")}
                      />
                      {errors.studentName && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                          {errors.studentName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-bold text-ink">
                      شماره تماس
                    </Label>
                    <Input
                      id="phone"
                      dir="ltr"
                      inputMode="tel"
                      placeholder="09xxxxxxxxx"
                      autoComplete="tel"
                      className="mt-2 h-12 rounded-xl text-left"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="note" className="text-sm font-bold text-ink">
                      توضیحات <span className="font-normal text-ink-soft">(اختیاری)</span>
                    </Label>
                    <Textarea
                      id="note"
                      rows={3}
                      placeholder="مثلاً: سابقه‌ی آموزش زبان دارد یا سؤال خاصی دارید…"
                      className="mt-2 rounded-xl"
                      {...register("note")}
                    />
                    {errors.note && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                        {errors.note.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="sun"
                    size="hero"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 aria-hidden="true" className="animate-spin" />
                        در حال ثبت…
                      </>
                    ) : (
                      <>
                        تعیین سطح و ثبت‌نام
                        <ArrowLeft aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
                {/* بازخورد درون‌خطی — جایگزین toast */}
                {feedback ? (
                  <p
                    role="status"
                    className={
                      feedback.kind === "success"
                        ? "rounded-xl bg-leaf-soft px-4 py-3 text-sm font-bold text-leaf"
                        : "rounded-xl bg-white/15 px-4 py-3 text-sm font-bold text-white"
                    }
                  >
                    {feedback.message}
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
