import Link from "next/link";
import { Blocks, TrendingUp, ArrowLeft, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

interface Audience {
  fa: string;
  en: string;
  description: string;
  chip: string;
  icon: LucideIcon;
  /** رنگ‌های کاشی */
  panel: string;
  chipStyle: string;
  iconColor: string;
  link: string;
}

/**
 * توجه: بازه‌ی سنی دوره‌ها در اطلاعات ورودی موجود نبوده؛
 * طبق اصل «عدم ساخت اطلاعات»، هیچ بازه‌ای نمایش داده نشده است.
 */
const audiences: Audience[] = [
  {
    fa: "کودکان",
    en: "Kids",
    description: "شروع یادگیری و ساخت پایه‌ی زبان؛ با بازی، داستان و مشارکت فعال در کلاس.",
    chip: "شروع مسیر",
    icon: Blocks,
    panel: "bg-brand-tint ring-brand/15",
    chipStyle: "bg-brand text-white",
    iconColor: "text-brand",
    link: "شناخت مسیر یادگیری",
  },
  {
    fa: "نوجوانان",
    en: "Teens",
    description: "تقویت مهارت‌های زبانی و اعتمادبه‌نفس؛ برای استفاده‌ی واقعی از زبان در دنیای امروز.",
    chip: "ادامه مسیر",
    icon: TrendingUp,
    panel: "bg-leaf-soft ring-leaf/20",
    chipStyle: "bg-leaf text-white",
    iconColor: "text-leaf",
    link: "شناخت مسیر یادگیری",
  },
];

/**
 * گروه‌های سنی — دو کاشی بزرگ بدون ادعای سنی ساختگی
 */
export function AgeGroups() {
  return (
    <section id="courses" aria-labelledby="courses-title" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="دوره‌ها"
            title={<span id="courses-title">برای هر سن، یک شروع درست</span>}
            description="دوره‌های آموزشگاه برای دو گروه اصلی طراحی شده‌اند؛ اما نقطه‌ی شروع هر زبان‌آموز، با تعیین سطح مشخص می‌شود."
          />
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:gap-10">
          {audiences.map((audience, i) => (
            <Reveal key={audience.fa} delay={i * 130} direction="none">
              <article
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-[28px] p-8 ring-1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-navy/10 md:p-10",
                  audience.panel
                )}
              >
                {/* واژه‌ی بزرگ تزئینی پس‌زمینه */}
                <span
                  aria-hidden="true"
                  dir="ltr"
                  className="pointer-events-none absolute -top-4 left-2 select-none text-7xl font-black uppercase tracking-tight text-navy/[0.05] transition-transform duration-500 group-hover:-translate-y-1 md:text-8xl"
                >
                  {audience.en}
                </span>

                <div className="relative flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-300 group-hover:-rotate-6",
                    )}
                  >
                    <audience.icon
                      aria-hidden="true"
                      className={cn("size-7", audience.iconColor)}
                    />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-extrabold",
                      audience.chipStyle
                    )}
                  >
                    {audience.chip}
                  </span>
                </div>

                <h3 className="relative mt-8 text-4xl font-black text-navy md:text-5xl">
                  {audience.fa}
                </h3>
                <p
                  dir="ltr"
                  className="relative mt-1 text-right text-sm font-bold uppercase tracking-[0.25em] text-ink-soft/60"
                >
                  {audience.en}
                </p>

                <p className="relative mt-4 flex-1 text-base leading-8 text-ink-soft md:text-lg md:leading-9">
                  {audience.description}
                </p>

                <Link
                  href="/courses"
                  className="relative mt-7 inline-flex w-fit items-center gap-2 rounded-xl py-2 text-[15px] font-bold text-navy underline decoration-2 decoration-navy/20 underline-offset-8 transition-colors hover:decoration-current"
                >
                  {audience.link}
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
                  />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
