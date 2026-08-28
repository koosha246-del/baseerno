import {
  MessageCircle,
  Headphones,
  LetterText,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

interface SkillConcept {
  en: string;
  fa: string;
  description: string;
  icon: LucideIcon;
  /** رنگ آیکن روی زمینه سرمه‌ای */
  color: string;
  /** رنگ زیرخط — باید کلاس کامل باشد تا Tailwind ببیند */
  underline: string;
  chipHover: string;
}

const concepts: SkillConcept[] = [
  {
    en: "Speaking",
    fa: "صحبت‌کردن",
    description: "حرف زدن از همان جلسات اول؛ بدون ترس از اشتباه کردن.",
    icon: MessageCircle,
    color: "text-sun",
    underline: "bg-sun",
    chipHover: "group-hover:bg-sun",
  },
  {
    en: "Listening",
    fa: "گوش‌دادن",
    description: "عادت‌کردن گوش به زبان واقعی، با تمرین هدفمند.",
    icon: Headphones,
    color: "text-[#7cb8ff]",
    underline: "bg-[#7cb8ff]",
    chipHover: "group-hover:bg-[#7cb8ff]",
  },
  {
    en: "Vocabulary",
    fa: "واژگان",
    description: "یادگیری کلمه‌ها در بافت داستان و ماجرا؛ نه فهرست‌های خشک.",
    icon: LetterText,
    color: "text-tang",
    underline: "bg-tang",
    chipHover: "group-hover:bg-tang",
  },
  {
    en: "Confidence",
    fa: "اعتمادبه‌نفس",
    description: "جرئت استفاده از زبان؛ در کلاس و بیرون از آن.",
    icon: Flame,
    color: "text-leaf",
    underline: "bg-leaf",
    chipHover: "group-hover:bg-leaf",
  },
];

/**
 * تجربه کلاس — بند سرمه‌ای با چهار مفهوم تایپوگرافیک
 */
export function ClassExperience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="relative overflow-hidden bg-navy py-20 md:py-28"
    >
      <div aria-hidden="true" className="bg-dots-light absolute inset-0 opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            tone="light"
            kicker="تجربه کلاس"
            title={<span id="experience-title">کلاس فقط درس خواندن نیست.</span>}
            description="زبان وقتی واقعاً یاد گرفته می‌شود که از آن استفاده کنیم؛ به همین دلیل کلاس‌های بصیر حول استفاده‌ی واقعی از زبان طراحی شده‌اند."
          />
        </Reveal>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 lg:gap-0">
          {concepts.map((concept, i) => (
            <Reveal
              key={concept.en}
              delay={i * 110}
              className={cn(
                "lg:px-8 lg:first:ps-0 lg:last:pe-0",
                i < concepts.length - 1 && "lg:border-e lg:border-white/10"
              )}
            >
              <article className="group text-center lg:text-start">
                {/* آیکن */}
                <div className="flex justify-center lg:justify-start">
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-2xl bg-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg",
                      concept.chipHover
                    )}
                  >
                    <concept.icon
                      aria-hidden="true"
                      className={cn(
                        "size-7 transition-colors duration-300 group-hover:text-navy",
                        concept.color
                      )}
                    />
                  </span>
                </div>

                {/* واژه انگلیسی + خط تأکیدی */}
                <h3
                  dir="ltr"
                  className="mt-5 text-center text-[1.7rem] font-black tracking-tight text-white lg:text-start"
                >
                  {concept.en}
                </h3>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-auto mt-2 block h-1 w-9 rounded-full transition-all duration-500 group-hover:w-full lg:mx-0",
                    concept.underline
                  )}
                />

                <p className="mt-3 text-lg font-bold text-blue-100">{concept.fa}</p>
                <p className="mt-2 text-sm leading-7 text-blue-100/60">
                  {concept.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
