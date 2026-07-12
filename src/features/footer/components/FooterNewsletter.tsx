"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, "ایمیل الزامی است.")
    .email("لطفاً یک ایمیل معتبر وارد کنید."),
});

type NewsletterData = z.infer<typeof newsletterSchema>;

/**
 * FooterNewsletter — email subscription form in the footer.
 */
export function FooterNewsletter({ className }: { className?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<NewsletterData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(_data: NewsletterData) {
    // In production: POST to API.
    console.log("Newsletter", _data);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 className="font-display text-sm font-bold text-fg-primary">
        خبرنامه بصیر نو
      </h3>
      <p className="text-sm text-fg-secondary">
        از آخرین دوره‌ها، مقالات و رویدادهای آکادمی مطلع شوید.
      </p>

      {isSubmitSuccessful ? (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
          <CheckCircle2 className="size-5 text-status-success" />
          <span className="text-sm font-medium text-status-success">
            با موفقیت ثبت شد!
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2" noValidate>
          <input
            {...register("email")}
            type="email"
            placeholder="ایمیل خود را وارد کنید"
            dir="ltr"
            aria-invalid={!!errors.email}
            className="w-full rounded-xl border border-app-border bg-surface px-4 py-2.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <Button
            type="submit"
            variant="solid"
            size="icon"
            aria-label="اشتراک در خبرنامه"
          >
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
