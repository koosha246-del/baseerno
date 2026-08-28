import Image from "next/image";
import { MoveLeft } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { books, type Book } from "@/lib/books-data";
import { cn } from "@/lib/utils";

const chipStyles: Record<Book["accent"], string> = {
  brand: "bg-brand/10 text-brand",
  sun: "bg-sun/20 text-[#9a6a00]",
  tang: "bg-tang/10 text-tang",
  leaf: "bg-leaf/10 text-leaf",
  navy: "bg-navy/10 text-navy",
};

/** چرخش ملایم متناوب جلدها */
const tilts = [
  "lg:rotate-[1.5deg]",
  "lg:-rotate-[1.5deg]",
  "lg:rotate-[2deg]",
  "lg:-rotate-2",
  "lg:rotate-[1.5deg]",
];

/**
 * منابع آموزشی — گالری کتاب‌های واقعی
 * دسکتاپ: گرید ۵ ستونه · موبایل: اسکرول افقی
 */
export function BooksShowcase() {
  return (
    <section id="books" aria-labelledby="books-title" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="منابع آموزشی"
            title={<span id="books-title">چه چیزی در کلاس یاد می‌گیریم؟</span>}
            description="مسیر یادگیری با منابع آموزشی مشخص و متناسب با سطح زبان طراحی شده است؛ این‌ها کتاب‌های واقعی‌ای هستند که در کلاس‌های بصیر تدریس می‌شوند."
          />
        </Reveal>

        {/* راهنمای اسکرول — فقط موبایل */}
        <Reveal delay={100}>
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink-soft lg:hidden">
            <MoveLeft aria-hidden="true" className="size-4 text-brand" />
            برای دیدن همه‌ی کتاب‌ها، صفحه را بکشید
          </p>
        </Reveal>

        {/* ── اسکرول افقی — موبایل و تبلت ─────────── */}
        <Reveal delay={150}>
          <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 lg:hidden">
            {books.map((book) => (
              <li key={book.id} className="w-60 shrink-0 snap-start">
                <article className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10">
                  <div className="overflow-hidden rounded-xl bg-brand-tint-2">
                    <Image
                      src={book.image}
                      alt={book.imageAlt}
                      width={300}
                      height={300}
                      sizes="240px"
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 dir="ltr" className="text-right text-lg font-extrabold text-navy">
                        {book.title}
                      </h3>
                      {book.levelLabel && (
                        <span
                          dir="ltr"
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                            chipStyles[book.accent]
                          )}
                        >
                          {book.levelLabel}
                        </span>
                      )}
                    </div>
                    <p dir="ltr" className="mt-1 text-right text-xs font-semibold text-ink-soft/80">
                      {book.edition}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink-soft">
                      {book.description}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ── گرید — دسکتاپ ───────────────────────── */}
        <Reveal delay={150}>
          <ul className="mt-10 hidden gap-6 lg:grid lg:grid-cols-5">
            {books.map((book, i) => (
              <li key={book.id} className={cn("transition-transform duration-300 hover:rotate-0", tilts[i])}>
                <article className="group flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-navy/10">
                  <div className="relative overflow-hidden rounded-xl bg-brand-tint-2 transition-transform duration-300 group-hover:scale-[1.03]">
                    <Image
                      src={book.image}
                      alt={book.imageAlt}
                      width={300}
                      height={300}
                      sizes="(max-width: 1024px) 0px, 240px"
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 dir="ltr" className="text-right text-lg font-extrabold text-navy">
                        {book.title}
                      </h3>
                      {book.levelLabel && (
                        <span
                          dir="ltr"
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                            chipStyles[book.accent]
                          )}
                        >
                          {book.levelLabel}
                        </span>
                      )}
                    </div>
                    <p dir="ltr" className="mt-1 text-right text-xs font-semibold text-ink-soft/80">
                      {book.edition}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink-soft">
                      {book.description}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
