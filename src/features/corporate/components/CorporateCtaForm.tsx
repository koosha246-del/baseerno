"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { corporateFormSchema, type CorporateFormData } from "../schema";
import { corporateCopy } from "../constants";

/**
 * CorporateCtaForm — consultation request form (React Hook Form + Zod).
 * Inline validation with Persian error messages.
 */
export function CorporateCtaForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm<CorporateFormData>({
    resolver: zodResolver(corporateFormSchema),
    defaultValues: {
      name: "",
      organization: "",
      role: "",
      phone: "",
      employeesCount: "1-50",
      message: "",
    },
  });

  function onSubmit(_data: CorporateFormData) {
    // In production: POST to API route.
    console.log("Corporate form submitted", _data);
  }

  const { title, description } = corporateCopy.form;

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <CheckCircle2 className="size-12 text-status-success" />
        <h3 className="font-display text-xl font-bold text-fg-primary">
          درخواست شما ثبت شد
        </h3>
        <p className="max-w-sm text-sm text-fg-secondary">
          کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت.
        </p>
        <Button variant="outline" onClick={() => reset()}>
          ثبت درخواست جدید
        </Button>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-xl border border-app-border bg-surface px-4 py-3 text-sm text-fg-primary transition-colors duration-base ease-luxury placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="rounded-2xl border border-app-border-subtle bg-surface p-6 shadow-md sm:p-8">
      <h3 className="font-display text-xl font-bold text-fg-primary">{title}</h3>
      <p className="mt-1.5 text-sm text-fg-secondary">{description}</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        {/* Name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <input
              {...register("name")}
              placeholder="نام و نام‌خانوادگی *"
              className={inputBase}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-status-danger">{errors.name.message}</p>
            )}
          </div>
          <div>
            <input
              {...register("organization")}
              placeholder="نام سازمان *"
              className={inputBase}
              aria-invalid={!!errors.organization}
            />
            {errors.organization && (
              <p className="mt-1 text-xs text-status-danger">
                {errors.organization.message}
              </p>
            )}
          </div>
        </div>

        {/* Phone + role */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <input
              {...register("phone")}
              placeholder="شماره تماس *"
              className={inputBase}
              dir="ltr"
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-status-danger">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <input
              {...register("role")}
              placeholder="سمت سازمانی"
              className={inputBase}
            />
          </div>
        </div>

        {/* Employee count */}
        <div>
          <select
            {...register("employeesCount")}
            className={inputBase}
            aria-label="تعداد کارکنان سازمان"
          >
            <option value="1-50">۱ تا ۵۰ نفر</option>
            <option value="51-200">۵۱ تا ۲۰۰ نفر</option>
            <option value="201-500">۲۰۱ تا ۵۰۰ نفر</option>
            <option value="500+">بیش از ۵۰۰ نفر</option>
          </select>
        </div>

        {/* Message */}
        <textarea
          {...register("message")}
          rows={3}
          placeholder="توضیحات اضافی (اختیاری)"
          className={inputBase + " resize-none"}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="text-xs text-status-danger">{errors.message.message}</p>
        )}

        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="mt-2 shadow-glow"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "در حال ارسال..."
          ) : (
            <>
              <Send className="size-4" />
              ارسال درخواست مشاوره
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
