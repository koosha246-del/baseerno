import Image from "next/image";
import {
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  School,
  Instagram,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { siteConfig } from "@/lib/site-config";

interface Fact {
  icon: LucideIcon;
  text: string;
}

const facts: Fact[] = [
  { icon: GraduationCap, text: "آموزش زبان انگلیسی برای کودکان و نوجوانان" },
  { icon: ClipboardCheck, text: "تعیین سطح پیش از شروع دوره" },
  { icon: BookOpen, text: "منابع آموزشی استاندارد و مشخص" },
  { icon: School, text: "کلاس‌های حضوری در محل آموزشگاه" },
];

/**
 * معرفی آموزشگاه — تصویر واقعی ساختمان + محتوای اعتمادساز
 */
export function AboutAcademy() {
  return (
    <section id="about" aria-labelledby="about-title" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* ── متن ─────────────────────────────── */}
          <div>
            <Reveal>
              <SectionHeading
                kicker="درباره ما"
                title={
                  <span id="about-title">
                    یک فضای واقعی برای شروع یک مسیر واقعی
                  </span>
                }
              />
            </Reveal>

            <Reveal delay={100}>
              <p className="mt-6 text-base leading-9 text-ink-soft md:text-lg md:leading-10">
                آموزشگاه زبان بصیر بستری برای یادگیری زبان انگلیسی کودکان و
                نوجوانان فراهم کرده است؛ جایی که یادگیری زبان از یک کلاس درس
                فراتر می‌رود و به یک تجربه‌ی واقعی تبدیل می‌شود.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                  <li
                    key={fact.text}
                    className="flex items-center gap-3 rounded-2xl bg-brand-tint-2 p-4 ring-1 ring-navy/5 transition-colors duration-300 hover:bg-brand-tint"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                      <fact.icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-[15px] font-bold leading-6 text-ink">
                      {fact.text}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild variant="brand" size="xl">
                  <a href={siteConfig.primaryCta.href}>
                    {siteConfig.primaryCta.label}
                    <ArrowLeft aria-hidden="true" />
                  </a>
                </Button>

                {/* اینستاگرام واقعی آموزشگاه — نوشته‌شده روی تابلوی ساختمان */}
                <Button asChild variant="outline-navy" size="xl">
                  <a
                    href={siteConfig.contact.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram aria-hidden="true" />
                    <span dir="ltr">@{siteConfig.contact.instagramHandle}</span>
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* ── تصویر ساختمان ───────────────────── */}
          <Reveal delay={150} direction="none">
            <figure className="relative mx-auto max-w-[560px]">
              {/* بلوک تأکیدی زرد */}
              <div
                aria-hidden="true"
                className="absolute -right-5 -top-5 h-36 w-36 rounded-[28px] bg-sun"
              />

              <div className="relative overflow-hidden rounded-[28px] shadow-2xl shadow-navy/20 ring-1 ring-navy/10">
                <Image
                  src="/images/building.webp"
                  alt="ساختمان آموزشگاه زبان بصیر — محل برگزاری کلاس‌ها"
                  width={1280}
                  height={772}
                  sizes="(max-width: 1024px) 92vw, 560px"
                  className="h-auto w-full object-cover"
                />
                {/* برچسب روی تصویر */}
                <figcaption className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-extrabold text-navy shadow-lg backdrop-blur-sm">
                  <span aria-hidden="true" className="size-2 rounded-full bg-leaf" />
                  محل آموزشگاه زبان بصیر
                </figcaption>
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
