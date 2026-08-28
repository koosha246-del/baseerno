import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const faqs = [
  {
    q: "دوره‌ها برای چه گروهی هستند؟",
    a: "دوره‌های بصیر نو برای دو گروه اصلی طراحی شده‌اند: کودکان و نوجوانان. برای هر زبان‌آموز، نقطه‌ی شروع با تعیین سطح مشخص می‌شود تا مسیر آموزشی متناسب با سن و سطح زبان او تنظیم شود.",
  },
  {
    q: "تعیین سطح چگونه انجام می‌شود؟",
    a: "پیش از شروع دوره، سطح زبان‌آموز از طریق ارزیابی تعیین می‌شود. نتیجه‌ی این ارزیابی مشخص می‌کند که مسیر یادگیری از کدام مرحله و با کدام منبع آغاز شود؛ تا نه از جایی خیلی عقب، نه از جایی خیلی جلو شروع شود.",
  },
  {
    q: "چه کتاب‌هایی تدریس می‌شوند؟",
    a: "منابع اصلی آموزشگاه مجموعه‌های استاندارد ACE it!، Smart English، Smart Plus، Milestones و Genius هستند؛ همان کتاب‌هایی که در بخش «منابع آموزشی» با جلد واقعی آن‌ها را می‌بینید. کتاب هر زبان‌آموز متناسب با سطح او انتخاب می‌شود.",
  },
  {
    q: "مسیر یادگیری چگونه است؟",
    a: "مسیر یادگیری مرحله‌به‌مرحله طراحی شده است: از شروع و ساخت پایه، تا تقویت، پیشرفت و رسیدن به سطح‌های بالاتر. هر مرحله با یک منبع مشخص گره خورده است تا پیشرفت زبان‌آموز همیشه قابل ردیابی باشد. می‌توانید نقشه‌ی کامل مسیر را در بخش «مسیر یادگیری» ببینید.",
  },
  {
    q: "چگونه ثبت‌نام کنیم؟",
    a: "کافی است فرم «تعیین سطح و ثبت‌نام» را در همین صفحه تکمیل کنید تا برای هماهنگی تعیین سطح با شما تماس بگیریم. همچنین می‌توانید از طریق اینستاگرام آموزشگاه پیام بدهید یا حضوری به آموزشگاه سر بزنید.",
  },
];

/**
 * سوالات متداول — آکاردئون با پاسخ‌های صادقانه و بدون اطلاعات ساختگی
 */
export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            kicker="سوالات متداول"
            title={<span id="faq-title">شاید سؤال شما هم این‌جا باشد</span>}
          />
        </Reveal>

        <Reveal delay={140}>
          <Accordion type="single" collapsible className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="rounded-2xl border border-navy/10 bg-white px-5 shadow-sm transition-shadow data-[state=open]:shadow-md md:px-7"
              >
                <AccordionTrigger className="gap-3 py-5 text-right text-base font-extrabold text-navy hover:no-underline md:text-lg [&>svg]:ml-0">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-[15px] leading-8 text-ink-soft">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
