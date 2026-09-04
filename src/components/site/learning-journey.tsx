import Image from "next/image";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { books, journeyStages, type Book } from "@/lib/books-data";
import { cn } from "@/lib/utils";

const bookById = new Map<string, Book>(books.map((b) => [b.id, b]));

/** رنگ هر مرحله — کلیدها همان اتحاد accent کتاب‌هاست تا دسترسی تایپ‌امن باشد */
const stageStyles: Record<
  Book["accent"],
  { dot: string; dotText: string; chip: string; chipText: string }
> = {
  brand: {
    dot: "bg-brand",
    dotText: "text-white",
    chip: "bg-brand/10",
    chipText: "text-brand",
  },
  tang: {
    dot: "bg-tang",
    dotText: "text-white",
    chip: "bg-tang/10",
    chipText: "text-tang",
  },
  sun: {
    dot: "bg-sun",
    dotText: "text-navy",
    chip: "bg-sun/20",
    chipText: "text-[#9a6a00]",
  },
  leaf: {
    dot: "bg-leaf",
    dotText: "text-white",
    chip: "bg-leaf/10",
    chipText: "text-leaf",
  },
  navy: {
    dot: "bg-navy",
    dotText: "text-white",
    chip: "bg-navy/10",
    chipText: "text-navy",
  },
};

/** چرخش‌های ملایم و متناوب کتاب‌ها */
const tilts = [
  "rotate-2",
  "-rotate-2",
  "rotate-[1.5deg]",
  "-rotate-[2.5deg]",
  "rotate-[2deg]",
];

/** موقعیت نقطه‌های مسیر (درصد، منطبق بر viewBox ‌SVG) */
const dotSpots = [
  { x: 90, y: 58.3 },
  { x: 70, y: 35 },
  { x: 50, y: 62.5 },
  { x: 30, y: 35 },
  { x: 10, y: 65 },
];

/**
 * مسیر یادگیری — نقشه راه موج‌دار با کتاب‌های واقعی
 * دسکتاپ: مسیر افقی SVG · موبایل: تایم‌لاین عمودی
 */
export function LearningJourney() {
  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="relative overflow-hidden bg-brand-tint py-20 md:py-28"
    >
      <div aria-hidden="true" className="bg-dots absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            kicker="مسیر یادگیری"
            title={<span id="journey-title">قدم‌به‌قدم؛ از شروع تا سطح بالاتر</span>}
            description="هر مرحله از مسیر با یکی از کتاب‌های واقعی آموزشگاه مشخص شده است؛ تا هم زبان‌آموز بداند کجای مسیر ایستاده، هم والدین تصویر روشنی از قدم بعدی داشته باشند."
          />
        </Reveal>

        {/* ── نقشه راه افقی — دسکتاپ ─────────────────── */}
        <Reveal delay={150} className="mt-16 hidden lg:block">
          <div className="relative">
            {/* مسیر موج‌دار نقطه‌چین */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 120"
              preserveAspectRatio="none"
              className="h-32 w-full"
            >
              <path
                d="M 900 70 C 835 70, 765 42, 700 42 C 635 42, 565 75, 500 75 C 435 75, 365 45, 300 45 C 235 45, 165 78, 100 78"
                fill="none"
                stroke="#9db9e6"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="0.5 15"
              />
              {/* فلش پایان مسیر (چپ) */}
              <path
                d="M 96 70 L 84 78 L 96 86"
                fill="none"
                stroke="#9db9e6"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* نقطه‌های ایستگاه */}
            {journeyStages.map((stage, i) => {
              const s = stageStyles[stage.accent];
              const spot = dotSpots[i] ?? { x: 50, y: 50 };
              return (
                <span
                  key={stage.id}
                  aria-hidden="true"
                  style={{
                    left: `calc(${spot.x}% - 22px)`,
                    top: `calc(${spot.y}% - 22px)`,
                  }}
                  className={cn(
                    "absolute z-10 flex size-11 items-center justify-center rounded-full text-lg font-black shadow-lg ring-4 ring-brand-tint transition-transform duration-300 hover:scale-110",
                    s.dot,
                    s.dotText
                  )}
                >
                  {stage.faNumber}
                </span>
              );
            })}
          </div>

          {/* محتوای مراحل */}
          <div className="mt-4 grid grid-cols-5 gap-6">
            {journeyStages.map((stage, i) => {
              const book = bookById.get(stage.bookId);
              if (!book) return null;
              return (
                <div key={stage.id} className="group flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "relative h-44 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-0",
                      tilts[i]
                    )}
                  >
                    <Image
                      src={book.image}
                      alt={book.imageAlt}
                      width={160}
                      height={160}
                      sizes="200px"
                      className="h-full w-auto rounded-lg object-contain drop-shadow-xl"
                    />
                  </div>
                  <span
                    dir="ltr"
                    className={cn(
                      "mt-5 rounded-full px-3 py-1 text-xs font-extrabold",
                      stageStyles[stage.accent].chip,
                      stageStyles[stage.accent].chipText
                    )}
                  >
                    {book.title}
                  </span>
                  <h3 className="mt-3 text-xl font-extrabold text-navy">
                    {stage.title}
                  </h3>
                  <p
                    dir="ltr"
                    className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft/70"
                  >
                    {stage.en}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-soft">
                    {stage.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* ── تایم‌لاین عمودی — موبایل و تبلت ────────── */}
        <Reveal delay={120} className="mt-12 lg:hidden">
          <ol className="relative">
            {journeyStages.map((stage, i) => {
              const book = bookById.get(stage.bookId);
              if (!book) return null;
              const s = stageStyles[stage.accent];
              return (
                <li key={stage.id} className="relative flex gap-5 pb-10 last:pb-0">
                  {/* خط اتصال عمودی */}
                  {i < journeyStages.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="path-dash absolute bottom-[-0.5rem] right-[21px] top-12 w-0.5"
                    />
                  )}

                  {/* نقطه ایستگاه */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "z-10 flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-black shadow-md",
                      s.dot,
                      s.dotText
                    )}
                  >
                    {stage.faNumber}
                  </span>

                  {/* محتوای مرحله */}
                  <div className="flex min-w-0 flex-1 items-start gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-navy/5 backdrop-blur-sm">
                    <Image
                      src={book.image}
                      alt={book.imageAlt}
                      width={80}
                      height={80}
                      sizes="80px"
                      className="h-20 w-20 shrink-0 rounded-lg object-contain shadow-md"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-lg font-extrabold text-navy">
                          {stage.title}
                        </h3>
                        <span
                          dir="ltr"
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
                            s.chip,
                            s.chipText
                          )}
                        >
                          {book.title}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-7 text-ink-soft">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
