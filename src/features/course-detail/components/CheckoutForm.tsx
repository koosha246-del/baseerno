"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  Landmark,
  Loader2,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatToman } from "@/lib/format";
import { checkoutSchema, type CheckoutData } from "../schema";
import type { CourseDetail } from "../types";

interface CheckoutFormProps {
  course: CourseDetail;
}

/**
 * CheckoutForm — sticky payment card with student details + payment method.
 * Shows price summary (with discount) and a success state after submit.
 */
export function CheckoutForm({ course }: CheckoutFormProps) {
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      paymentMethod: "zarinpal",
      agreeTerms: false as unknown as true,
    },
  });

  const selectedMethod = watch("paymentMethod");  const isFree = course.price == null || course.price === 0;
  // The course has no row in the store database (static-only editorial
  // catalog entry) — checkout/enrollment would always 404 there, so show
  // an honest notice instead of a payment form that cannot succeed.
  const inStore = course.purchasable !== false;
  const hasDiscount =
    course.originalPrice != null && !isFree && course.originalPrice > (course.price ?? 0);
  const discountAmount = hasDiscount
    ? (course.originalPrice ?? 0) - (course.price ?? 0)
    : 0;

  function onSubmit(data: CheckoutData) {
    const payload = {
      courseId: course.id,
      studentName: data.fullName,
      studentEmail: data.email,
      studentPhone: data.phone,
      paymentMethod: data.paymentMethod,
    };

    setFormError("");
    return fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        // Guest → send them to login and come back to this course.
        if (res.status === 401) {
          window.location.assign(
            `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
          );
          return { redirecting: true } as const;
        }
        const result = await res.json().catch(() => ({}));
        if (!res.ok || result.error) {
          throw new Error(result.error ?? "خطایی در فرآیند پرداخت رخ داد.");
        }
        return result as {
          simulated?: boolean;
          callbackUrl?: string;
          redirectUrl?: string;
          free?: boolean;
          gateway?: string;
          redirecting?: boolean;
        };
      })
      .then((result) => {
        if (result.redirecting) return;
        // Paid flow: redirect to Zarinpal (or simulated callback URL).
        const target = result.redirectUrl || result.callbackUrl;
        if (target && !result.free) {
          window.location.href = target;
          return;
        }
        // Free enrollment: success handled by isSubmitSuccessful.
      })
      .catch((err: Error) => {
        // Inline error — an alert() would block the UI and can't be styled
        // for the RTL layout.
        console.error("Checkout error:", err.message);
        setFormError(err.message || "خطایی در فرآیند پرداخت رخ داد.");
      });
  }

  if (!inStore) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-app-border-subtle bg-surface p-8 text-center shadow-md">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Store className="size-6" />
        </span>
        <h3 className="font-display text-lg font-bold text-fg-primary">
          ثبت‌نام این دوره به‌زودی فعال می‌شود
        </h3>
        <p className="max-w-xs text-sm leading-relaxed text-fg-secondary">
          این صفحه هنوز به فروشگاه متصل نشده. برای اطلاع از زمان شروع ثبت‌نام
          یا کمک در انتخاب دوره، با پشتیبانی تماس بگیرید.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/contact">تماس با پشتیبانی</Link>
        </Button>
      </div>
    );
  }

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="size-14 text-status-success" />
        <h3 className="font-display text-xl font-bold text-fg-primary">
          {isFree ? "ثبت‌نام شما با موفقیت انجام شد!" : "پرداخت با موفقیت انجام شد!"}
        </h3>
        <p className="max-w-xs text-sm text-fg-secondary">
          جزئیات دوره و لینک دسترسی به ایمیل شما ارسال شد.
        </p>
        <Button variant="outline" onClick={() => reset()}>
          ثبت‌نام در دوره دیگر
        </Button>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  const paymentMethods = [
    { id: "zarinpal", label: "درگاه زرین‌پال", icon: CreditCard },
    { id: "saman", label: "بانک سامان", icon: Landmark },
    { id: "wallet", label: "کیف پول", icon: Wallet },
  ] as const;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-2xl border border-app-border-subtle bg-surface p-6 shadow-md"
      noValidate
    >
      {/* Price summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-fg-secondary">قیمت دوره</span>
          {hasDiscount ? (
            <span className="text-sm text-fg-muted line-through">
              {formatToman(course.originalPrice ?? 0)}
            </span>
          ) : null}
        </div>
        {hasDiscount ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-status-success">تخفیف ویژه</span>
            <span className="text-sm font-bold text-status-success">
              {formatToman(discountAmount)}-
            </span>
          </div>
        ) : null}
        <Separator className="my-1" />
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-fg-primary">مبلغ نهایی</span>
          {isFree ? (
            <span className="font-display text-2xl font-extrabold text-status-success">
              رایگان
            </span>
          ) : (
            <span className="font-display text-2xl font-extrabold text-fg-primary">
              {formatToman(course.price ?? 0)}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Student info */}
      <div className="flex flex-col gap-3">
        <div>
          <input
            {...register("fullName")}
            placeholder="نام و نام‌خانوادگی *"
            className={inputBase}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-status-danger">{errors.fullName.message}</p>
          )}
        </div>
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="ایمیل *"
            dir="ltr"
            className={cn(inputBase, "text-left")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-status-danger">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            {...register("phone")}
            placeholder="شماره تماس *"
            dir="ltr"
            className={cn(inputBase, "text-left")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-status-danger">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Payment methods */}
      {!isFree && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-fg-primary">روش پرداخت</span>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              const active = selectedMethod === m.id;
              return (
                <label
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-app-border bg-surface text-fg-secondary hover:border-accent/40"
                  )}
                >
                  <input
                    type="radio"
                    value={m.id}
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  <Icon className="size-5" />
                  <span className="text-[0.7rem] font-semibold">{m.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Terms */}
      <label className="flex items-start gap-2 text-sm text-fg-secondary">
        <input
          type="checkbox"
          {...register("agreeTerms")}
          className="mt-0.5 size-4 rounded border-app-border text-accent focus:ring-accent"
        />
        <span>
          <a href="/terms" className="text-accent underline">قوانین و مقررات</a> را خوانده و
          می‌پذیرم.
        </span>
      </label>
      {errors.agreeTerms && (
        <p className="-mt-2 text-xs text-status-danger">{errors.agreeTerms.message}</p>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {formError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="shadow-glow"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            در حال پردازش...
          </>
        ) : isFree ? (
          "ثبت‌نام رایگان"
        ) : (
          <>
            <CreditCard className="size-5" />
            پرداخت {formatToman(course.price ?? 0)}
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-fg-muted">
        <ShieldCheck className="size-4 text-status-success" />
        پرداخت امن با درگاه معتبر بانکی
      </p>
    </form>
  );
}
