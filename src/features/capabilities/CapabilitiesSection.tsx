import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientText } from "@/components/shared/GradientText";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { cn } from "@/lib/utils";
import { capabilityItems } from "./constants";

const toneClasses = {
  sky: "bg-kid-sky-50 text-kid-sky-600 group-hover:bg-kid-sky-100 dark:bg-kid-sky-500/15 dark:text-kid-sky-300 dark:group-hover:bg-kid-sky-500/25",
  coral:
    "bg-kid-coral-50 text-kid-coral-600 group-hover:bg-kid-coral-100 dark:bg-kid-coral-500/15 dark:text-kid-coral-300 dark:group-hover:bg-kid-coral-500/25",
  mint: "bg-kid-mint-50 text-kid-mint-600 group-hover:bg-kid-mint-100 dark:bg-kid-mint-500/15 dark:text-kid-mint-300 dark:group-hover:bg-kid-mint-500/25",
  sunny:
    "bg-kid-sunny-50 text-kid-sunny-600 group-hover:bg-kid-sunny-100 dark:bg-kid-sunny-500/15 dark:text-kid-sunny-300 dark:group-hover:bg-kid-sunny-500/25",
  lavender:
    "bg-kid-lavender-50 text-kid-lavender-600 group-hover:bg-kid-lavender-100 dark:bg-kid-lavender-500/15 dark:text-kid-lavender-300 dark:group-hover:bg-kid-lavender-500/25",
  peach:
    "bg-kid-peach-50 text-kid-peach-500 group-hover:bg-kid-peach-100 dark:bg-kid-peach-400/15 dark:text-kid-peach-300 dark:group-hover:bg-kid-peach-400/25",
} as const;

/**
 * CapabilitiesSection — the product tour of the homepage.
 *
 * A bento grid where every tile is a real platform feature with a link to
 * the actual page (AI tutor, certificates, grades, library, messages,
 * notifications, payments, search, teacher panel, ops, courses). The AI
 * tile is featured 2×2 with a mini chat preview; all tones adapt to the
 * light/dark theme via the `dark:` variants.
 */
export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="bg-surface-muted py-20 lg:py-28">
      <Container width="page">
        <ScrollReveal>
          <SectionHeading
            eyebrow="یک پلتفرم، همه‌چیز"
            title={
              <>
                هر چیزی که برای <GradientText>یادگیری</GradientText> لازم داری
              </>
            }
            description="فقط فیلم نمی‌بینی — تمرین، آزمون، بازخورد، گواهی و دستیار هوشمند، همه یک‌جا."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {capabilityItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={item.id}
                delay={i * 0.04}
                className={cn(
                  item.featured && "sm:col-span-2 lg:col-span-2 lg:row-span-2",
                  item.wide && "sm:col-span-2 lg:col-span-2",
                )}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-app-border-subtle bg-surface p-6 transition-all duration-base ease-luxury hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg",
                    item.featured &&
                      "bg-gradient-to-br from-kid-sky-50 via-surface to-kid-lavender-50 dark:from-kid-sky-500/10 dark:via-surface dark:to-kid-lavender-500/10",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl transition-colors duration-base",
                      toneClasses[item.tone],
                    )}
                  >
                    <Icon className="size-6" />
                  </span>

                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-lg font-bold text-fg-primary">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-loose text-fg-secondary">
                      {item.description}
                    </p>
                  </div>

                  {/* Featured tile: mini AI chat preview */}
                  {item.featured ? (
                    <div className="mt-auto space-y-2" aria-hidden>
                      <div className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-ee-sm bg-accent px-3 py-2 text-xs leading-relaxed text-white">
                        معنی «look forward to» چیه؟
                      </div>
                      <div className="w-fit max-w-[85%] rounded-2xl rounded-es-sm bg-surface-muted px-3 py-2 text-xs leading-relaxed text-fg-primary shadow-sm dark:bg-surface-subtle">
                        یعنی «مشتاقانه منتظر…» — در پایان ایمیل‌های رسمی. ✍️
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 flex-1 items-center rounded-full border border-app-border bg-surface px-3 text-[0.7rem] text-fg-muted">
                          سؤال دیگری بپرس…
                        </div>
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                          <Send className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-accent opacity-0 transition-opacity duration-base group-hover:opacity-100">
                      مشاهده
                      <ArrowLeft className="size-4 transition-transform duration-base ease-luxury group-hover:-translate-x-1" />
                    </span>
                  )}
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
