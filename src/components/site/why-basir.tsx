import { Users, Route, BookOpen, MessagesSquare, ArrowLeft } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

interface Feature {
  faNumber: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  /** رنگ تأکیدی */
  chip: string;
  ring: string;
  text: string;
}

const features: Feature[] = [
  {
    faNumber: "۰۱",
    icon: Users,
    title: "یادگیری متناسب با سن",
    description: "آموزش متناسب با گروه سنی و سطح زبان هر زبان‌آموز تنظیم می‌شود.",
    chip: "bg-brand/10",
    ring: "group-hover:ring-brand/60",
    text: "text-brand",
  },
  {
    faNumber: "۰۲",
    icon: Route,
    title: "مسیر آموزشی مشخص",
    description: "حرکت مرحله‌به‌مرحله از سطح مناسب، با تصویر روشن از قدم بعدی.",
    chip: "bg-tang/10",
    ring: "group-hover:ring-tang/60",
    text: "text-tang",
  },
  {
    faNumber: "۰۳",
    icon: BookOpen,
    title: "منابع آموزشی استاندارد",
    description: "استفاده از کتاب‌های مشخص و استاندارد در تمام طول مسیر یادگیری.",
    chip: "bg-sun/20",
    ring: "group-hover:ring-sun",
    text: "text-[#b57e00]",
  },
  {
    faNumber: "۰۴",
    icon: MessagesSquare,
    title: "محیط یادگیری پویا",
    description: "تمرکز روی مشارکت و استفاده واقعی از زبان، در دل کلاس.",
    chip: "bg-leaf/10",
    ring: "group-hover:ring-leaf/60",
    text: "text-leaf",
  },
];

/**
 * چرا بصیر؟ — چیدمان ادیتوریال به‌جای کارت‌های تکراری:
 * ستون معرفی + فهرست شماره‌گذاری‌شده با موتیف «ایستگاه‌های مسیر»
 */
export function WhyBasir() {
  return (
    <section id="why" aria-labelledby="why-title" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ستون معرفی */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading
                kicker="چرا بصیر؟"
                title={
                  <span id="why-title">
                    چرا مسیر یادگیری در بصیر متفاوت است؟
                  </span>
                }
                description="یادگیری زبان برای ما یک اتفاق نیست؛ یک مسیر است. مسیری که با شناخت زبان‌آموز شروع می‌شود و قدم‌به‌قدم، با منابع درست، ادامه پیدا می‌کند."
              />
            </Reveal>

            <Reveal delay={140}>
              <a
                href="#journey"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl px-1 py-2 text-base font-bold text-brand transition-colors hover:text-brand-dark"
              >
                مسیر یادگیری را ببینید
                <ArrowLeft
                  aria-hidden="true"
                  className="size-5 transition-transform duration-300 group-hover:-translate-x-1"
                />
              </a>
            </Reveal>
          </div>

          {/* فهرست مزیت‌ها — ۲×۲ */}
          <div className="lg:col-span-7">
            <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {features.map((feature, i) => (
                <Reveal key={feature.faNumber} delay={i * 100}>
                  <article className="group">
                    {/* شماره ایستگاه — دایره خط‌تیره‌ای */}
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-12 items-center justify-center rounded-full border-2 border-dashed border-navy/25 text-lg font-black text-navy/70 transition-all duration-300",
                          feature.ring
                        )}
                      >
                        {feature.faNumber}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-px flex-1 bg-navy/10 transition-colors duration-300 group-hover:bg-navy/20"
                      />
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3",
                          feature.chip
                        )}
                      >
                        <feature.icon
                          aria-hidden
                          className={cn("size-6", feature.text)}
                        />
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-extrabold text-navy">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-7 text-ink-soft">
                      {feature.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
