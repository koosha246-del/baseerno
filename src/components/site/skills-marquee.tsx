/**
 * نوار متحرک مهارت‌ها — بند سرمه‌ای بین هیرو و «چرا بصیر»
 */
const skills = [
  { fa: "صحبت‌کردن", en: "Speaking" },
  { fa: "گوش‌دادن", en: "Listening" },
  { fa: "خواندن", en: "Reading" },
  { fa: "نوشتن", en: "Writing" },
  { fa: "واژگان", en: "Vocabulary" },
];

function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex w-max items-center"
    >
      {skills.map((skill) => (
        <li key={skill.en} className="flex items-center">
          <span className="flex items-baseline gap-3 px-8">
            <span className="text-lg font-extrabold text-white md:text-xl">
              {skill.fa}
            </span>
            <span
              dir="ltr"
              className="text-sm font-bold uppercase tracking-[0.2em] text-sun"
            >
              {skill.en}
            </span>
          </span>
          {/* جداکننده لوزی */}
          <span
            aria-hidden="true"
            className="size-2 rotate-45 rounded-[2px] bg-sun/70"
          />
        </li>
      ))}
    </ul>
  );
}

export function SkillsMarquee() {
  return (
    <section aria-label="مهارت‌های زبانی" className="bg-navy py-5">
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee-landing flex w-max">
          <MarqueeRow />
          <MarqueeRow ariaHidden />
        </div>
      </div>
    </section>
  );
}
