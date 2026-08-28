import Image from "next/image";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

/**
 * هیرو — ترکیب‌بندی لایه‌لایه با تصویر واقعی کلاس
 * متن از راست، تصویر کلاس در سمت چپ با عناصر شناور
 */
export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-brand-tint"
    >
      {/* پترن نقطه‌ای پس‌زمینه */}
      <div
        aria-hidden="true"
        className="bg-dots absolute inset-0 opacity-50"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 md:pb-24 md:pt-36 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ── متن هیرو ─────────────────────────── */}
          <div className="lg:col-span-6">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-sun/25 px-4 py-1.5 text-sm font-bold text-[#8a6100]">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-sun" />
                آموزش زبان انگلیسی برای کودکان و نوجوانان
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1
                id="hero-title"
                className="mt-6 text-[2.5rem] font-black leading-[1.25] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem] lg:leading-[1.22]"
              >
                انگلیسی را یاد بگیر؛
                <br />
                <span className="relative inline-block text-brand">
                  دنیا را تجربه کن.
                  {/* زیرخط دست‌نویس زرد */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 14"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 right-0 h-3 w-full text-sun"
                  >
                    <path
                      d="M4 10 Q 58 2 110 8 T 216 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-7 max-w-lg text-base leading-8 text-ink-soft md:text-lg md:leading-9">
                آموزش زبان انگلیسی برای کودکان و نوجوانان، با مسیر آموزشی
                مشخص و منابع استاندارد؛ از تعیین سطح تا قدم‌های بالاتر.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild variant="brand" size="hero" className="w-full sm:w-auto">
                  <a href="#register">
                    تعیین سطح و ثبت‌نام
                    <ArrowLeft aria-hidden="true" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline-navy"
                  size="hero"
                  className="w-full sm:w-auto"
                >
                  <a href="#courses">مشاهده دوره‌ها</a>
                </Button>
              </div>
            </Reveal>

            {/* نشان‌های اعتماد — بدون هیچ عدد ساختگی */}
            <Reveal delay={320}>
              <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-ink/75">
                {[
                  "تعیین سطح پیش از شروع",
                  "مسیر مرحله‌به‌مرحله",
                  "منابع آموزشی استاندارد",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-[18px] text-leaf"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* ── تصویر کلاس ───────────────────────── */}
          <div className="relative lg:col-span-6">
            {/* تایپوگرافی لایه‌ای پس‌زمینه */}
            <span
              aria-hidden="true"
              dir="ltr"
              className="pointer-events-none absolute -top-12 right-0 z-0 select-none text-[6rem] font-black uppercase leading-none tracking-tight text-navy/[0.06] lg:-top-16 lg:text-[9rem]"
            >
              English
            </span>

            <Reveal delay={150} direction="none">
              <div className="relative z-10 mx-auto max-w-[520px]">
                {/* بلوک تأکیدی زرد — پشت تصویر */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-5 -left-5 h-40 w-40 rounded-[28px] bg-sun"
                />

                {/* قاب تصویر کلاس */}
                <figure className="relative overflow-hidden rounded-[28px] shadow-2xl shadow-navy/25 ring-1 ring-navy/10">
                  <Image
                    src="/images/hero-classroom.webp"
                    alt="کلاس بصیر نو؛ دو زبان‌آموز جلوی تخته در حال یادگیری"
                    width={1122}
                    height={1402}
                    priority
                    sizes="(max-width: 1024px) 92vw, 520px"
                    className="h-auto w-full object-cover"
                  />
                </figure>

                {/* استیکر دوزبانه شناور */}
                <div
                  className="animate-float-soft absolute -right-3 top-8 z-20 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-navy/15 ring-1 ring-navy/5 sm:-right-6"
                  aria-hidden="true"
                >
                  <p className="text-sm font-extrabold text-navy">
                    Hello! <span className="text-brand">سلام!</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-ink-soft">
                    زبان از همین‌جا شروع می‌شود
                  </p>
                </div>

                {/* کارت شناور مسیر یادگیری */}
                <div className="absolute -bottom-7 right-4 z-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-navy/15 ring-1 ring-navy/5 sm:right-8">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-tint text-lg font-black text-brand">
                    ۵
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-extrabold text-navy">
                      مسیر یادگیری
                    </span>
                    <span className="mt-1 flex items-center gap-1" aria-hidden="true">
                      <span className="size-2 rounded-full bg-brand" />
                      <span className="h-0.5 w-2.5 rounded bg-navy/20" />
                      <span className="size-2 rounded-full bg-tang" />
                      <span className="h-0.5 w-2.5 rounded bg-navy/20" />
                      <span className="size-2 rounded-full bg-sun" />
                      <span className="h-0.5 w-2.5 rounded bg-navy/20" />
                      <span className="size-2 rounded-full bg-leaf" />
                      <span className="h-0.5 w-2.5 rounded bg-navy/20" />
                      <span className="size-2 rounded-full bg-navy" />
                    </span>
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
