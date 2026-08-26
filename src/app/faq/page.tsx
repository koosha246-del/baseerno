import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { GradientText } from "@/components/shared/GradientText";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MessageCircleQuestion, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "سوالات متداول | بصیر نو",
  description:
    "پاسخ سوالات پرتکرار درباره بصیر نو، ثبت‌نام، دوره‌های آموزشی، تعیین سطح، اشتراک و پشتیبانی.",
  alternates: {
    canonical: "/faq",
  },
};

const faqCategories = [
  {
    title: "ثبت‌نام و اشتراک",
    items: [
      {
        q: "آیا ثبت‌نام رایگان است؟",
        a: "ساخت حساب کاربری رایگان است. جزئیات دسترسی و هزینه هر دوره را در صفحه همان دوره بررسی کنید.",
        value: "reg-1",
      },
      {
        q: "چطور ثبت‌نام کنم؟",
        a: "روی دکمه «ثبت‌نام رایگان» بزنید و اطلاعات خواسته‌شده در فرم را تکمیل کنید.",
        value: "reg-2",
      },
      {
        q: "آیا می‌تونم اشتراکمو لغو کنم؟",
        a: "بله، در هر زمانی می‌تونید از طریق پنل کاربری اشتراکتون رو لغو کنید. هیچ تعهد بلندمدتی وجود نداره و تا پایان دوره اشتراک به دوره‌ها دسترسی دارید.",
        value: "reg-3",
      },
    ],
  },
  {
    title: "دوره‌ها و آموزش",
    items: [
      {
        q: "از چه سطحی شروع کنم؟",
        a: "اگه هیچ پیش‌زمینه‌ای ندارید، از دوره «انگلیسی از صفر» (سطح A1) شروع کنید. اگه قبلاً یاد گرفتید، می‌تونید آزمون تعیین سطح رایگان ما رو انجام بدید تا سطح مناسب رو بهتون پیشنهاد بدیم.",
        value: "course-1",
      },
      {
        q: "دوره‌ها به چه صورت برگزار می‌شه؟",
        a: "دوره‌ها ترکیبی از ویدیوهای آموزشی، تمرین‌های تعاملی، آزمون‌های کوتاه و بازخورد شخصی مدرس هستند. می‌تونید با سرعت خودتون پیش برید و هر درس رو چند بار تماشا کنید.",
        value: "course-2",
      },
      {
        q: "آیا گواهی پایان دوره دارید؟",
        a: "بله! بعد از اتمام موفق هر دوره، گواهی الکترونیکی معتبر از طرف آکادمی بصیر نو دریافت می‌کنید که قابل اشتراک‌گذاری در لینکدین و رزومه است.",
        value: "course-3",
      },
    ],
  },
  {
    title: "کتاب‌ها و منابع",
    items: [
      {
        q: "از چه کتاب‌هایی استفاده می‌کنید؟",
        a: "فهرست منابع فعلی، مشخصات سطح، نویسنده و توضیح هر کتاب در صفحه کتابخانه نمایش داده می‌شود.",
        value: "book-1",
      },
      {
        q: "آیا کتاب‌ها جداگانه فروخته می‌شوند؟",
        a: "کتاب‌های قابل تهیه و شیوه دسترسی به هرکدام در صفحه کتابخانه مشخص شده است.",
        value: "book-2",
      },
    ],
  },
  {
    title: "پشتیبانی و ارتباط",
    items: [
      {
        q: "چطور با پشتیبانی تماس بگیرم؟",
        a: "از فرم صفحه «ارتباط با ما»، ایمیل یا شماره تلفن درج‌شده در همان صفحه استفاده کنید. ساعات پاسخگویی تلفنی نیز آنجا نوشته شده است.",
        value: "support-1",
      },
      {
        q: "اساتید چه مدرکی دارند؟",
        a: "اطلاعات مدرس و سوابق مرتبط باید در صفحه هر دوره درج شود؛ پیش از ثبت‌نام همان بخش را بررسی کنید یا از پشتیبانی بپرسید.",
        value: "support-2",
      },
      {
        q: "آیا جلسه مشاوره رایگان دارید؟",
        a: "برای اطلاع از امکان مشاوره و زمان‌های موجود، از راه‌های درج‌شده در صفحه تماس پیام بفرستید.",
        value: "support-3",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main id="main-content" className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      {/* Breadcrumb */}
      <Container width="page" className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>سوالات متداول</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Container>

      {/* Hero */}
      <Container width="narrow">
        <section className="public-page-hero mb-16 text-right">
          <ScrollReveal>
            <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-kid-sky-100 px-4 py-1.5 text-sm font-bold text-kid-sky-700">
              <MessageCircleQuestion className="size-4" />
              راهنما
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-4xl">
              <GradientText>سوالات متداول</GradientText>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-loose text-fg-secondary">
              پاسخ سوالات پرتکرار شما درباره بصیر نو، ثبت‌نام، دوره‌ها،
              تعیین سطح، اشتراک و پشتیبانی.
            </p>
          </ScrollReveal>
        </section>

        {/* FAQ Categories */}
        <div className="flex flex-col gap-12">
          {faqCategories.map((category, ci) => (
            <section key={category.title}>
              <ScrollReveal delay={ci * 0.04}>
                <h2 className="mb-6 font-display text-xl font-bold text-fg-primary">
                  {category.title}
                </h2>
              </ScrollReveal>

              <Accordion type="single" collapsible className="space-y-2.5">
                {category.items.map((faq, fi) => (
                  <ScrollReveal key={faq.value} delay={(ci * 3 + fi) * 0.03}>
                    <AccordionItem
                      value={faq.value}
                      className="rounded-2xl border border-app-border-subtle bg-surface shadow-sm transition-all data-[state=open]:border-accent/40 data-[state=open]:shadow-md"
                    >
                      <AccordionTrigger className="px-5 sm:px-6">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-5 sm:px-6 leading-loose">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  </ScrollReveal>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        {/* Still have questions? */}
        <section className="mt-16 rounded-2xl border border-app-border bg-surface-muted/50 p-8 text-center sm:p-10">
          <ScrollReveal>
            <h2 className="font-display text-xl font-bold text-fg-primary">
              هنوز جواب سوالت رو پیدا نکردی؟
            </h2>
            <p className="mt-2 text-sm text-fg-secondary">
              از صفحه تماس، راه ارتباطی مناسب و ساعات پاسخگویی را ببین.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="brand" size="md">
                <Link href="/contact">
                  <Mail className="size-4" />
                  ارتباط با ما
                </Link>
              </Button>
              <Button asChild variant="outline" size="md">
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  بازگشت به صفحه اصلی
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </Container>
    </main>
  );
}
