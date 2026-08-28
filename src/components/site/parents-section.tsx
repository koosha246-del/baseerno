import { CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { siteConfig } from "@/lib/site-config";

const trustPoints = [
  "مسیر آموزشی مشخص برای هر زبان‌آموز",
  "تعیین سطح پیش از شروع دوره",
  "منابع آموزشی استاندارد و مشخص",
  "محیطی امن و پویا برای یادگیری",
  "پیگیری پیشرفت زبان‌آموز، مرحله‌به‌مرحله",
];

/**
 * بخش والدین — ایجاد اعتماد، بدون ادعا و اغراق
 */
export function ParentsSection() {
  return (
    <section
      id="parents"
      aria-labelledby="parents-title"
      className="bg-brand-tint-2 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── متن ─────────────────────────────── */}
          <div>
            <Reveal>
              <SectionHeading
                kicker="برای والدین"
                title={<span id="parents-title">برای والدین؛ یک انتخاب مطمئن‌تر</span>}
              />
            </Reveal>

            <Reveal delay={100}>
              <p className="mt-6 text-base leading-9 text-ink-soft md:text-lg md:leading-10">
                می‌دانیم انتخاب آموزشگاه برای فرزندتان تصمیم ساده‌ای نیست. در
                بصیر تلاش می‌کنیم شما در هر قدم از مسیر بدانید فرزندتان کجای
                یادگیری ایستاده، با چه منابعی پیش می‌رود و قدم بعدی‌اش چیست.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button asChild variant="brand" size="xl">
                  <a href={siteConfig.primaryCta.href}>
                    {siteConfig.primaryCta.label}
                    <ArrowLeft aria-hidden="true" />
                  </a>
                </Button>
                <p className="text-sm leading-7 text-ink-soft">
                  برای هر سؤال دیگری، از طریق اینستاگرام با ما در ارتباط باشید.
                </p>
              </div>
            </Reveal>
          </div>

          {/* ── پنل چک‌لیست ─────────────────────── */}
          <Reveal delay={150} direction="none">
            <div className="relative overflow-hidden rounded-[28px] bg-navy p-8 shadow-2xl shadow-navy/25 md:p-10">
              <div
                aria-hidden="true"
                className="bg-dots-light absolute inset-0 opacity-40"
              />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-sun/20">
                    <ShieldCheck aria-hidden="true" className="size-6 text-sun" />
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    آنچه برای ما اهمیت دارد
                  </h3>
                </div>

                <ul className="mt-8 space-y-4">
                  {trustPoints.map((point, i) => (
                    <li
                      key={point}
                      className="flex items-center gap-3.5 rounded-2xl bg-white/5 px-4 py-3.5 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10"
                      style={{ transitionDelay: `${i * 20}ms` }}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-6 shrink-0 text-leaf"
                      />
                      <span className="text-[15px] font-bold text-blue-50 md:text-base">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
