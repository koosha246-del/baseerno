import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";
import { ContactForm } from "./ContactForm";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  MessageCircle,
  Youtube,
  Clock,
  Headphones,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: `ارتباط با آکادمی ${siteConfig.name} — ${siteConfig.contact.address}. پشتیبانی ۲۴ ساعته.`,
};

const supportChannels = [
  {
    icon: Headphones,
    title: "پشتیبانی تلفنی",
    detail: "پاسخگویی از ۹ صبح تا ۶ عصر",
    color: "bg-kid-sky-50 text-kid-sky-600",
  },
  {
    icon: MessageSquare,
    title: "چت آنلاین",
    detail: "تو داشبورد، پاسخ کمتر از ۵ دقیقه",
    color: "bg-kid-mint-50 text-kid-mint-600",
  },
  {
    icon: Mail,
    title: "ایمیل",
    detail: "پاسخ کمتر از ۲۴ ساعت",
    color: "bg-kid-coral-50 text-kid-coral-600",
  },
];

const workingHours = [
  { day: "شنبه تا چهارشنبه", hours: "۹:۰۰ - ۱۸:۰۰" },
  { day: "پنج‌شنبه", hours: "۹:۰۰ - ۱۴:۰۰" },
  { day: "جمعه", hours: "تعطیل" },
];

export default function ContactPage() {
  return (
    <main className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="page">
        {/* Hero */}
        <section className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-kid-mint-100 px-4 py-1.5 text-sm font-semibold text-kid-mint-600">
            <MessageSquare className="size-4" />
            پشتیبانی ۲۴ ساعته
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-5xl">
            پیام بده، جواب می‌دیم
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-loose text-fg-secondary">
            سوالی درباره دوره‌ها، ثبت‌نام یا هر چیز دیگه داری؟ تیم پشتیبانی ما
            آماده کمکه. هر روشی که راحتی انتخاب کن.
          </p>
        </section>

        {/* Support channels */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          {supportChannels.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="flex items-center gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                  <Icon className="size-6" />
                </span>
                <div>
                  <h3 className="font-bold text-fg-primary">{c.title}</h3>
                  <p className="mt-0.5 text-sm text-fg-secondary">{c.detail}</p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Contact info */}
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-xl font-bold text-fg-primary">
              راه‌های ارتباطی
            </h2>

            <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kid-sky-50 text-kid-sky-600">
                <Mail className="size-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-fg-primary">ایمیل</h3>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="mt-1 block text-sm text-fg-secondary transition-colors hover:text-accent"
                  dir="ltr"
                >
                  {siteConfig.contact.email}
                </a>
                <p className="mt-1 text-xs text-fg-muted">پاسخ کمتر از ۲۴ ساعت</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kid-mint-50 text-kid-mint-600">
                <Phone className="size-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-fg-primary">تلفن</h3>
                <a
                  href={`tel:${siteConfig.contact.phoneHref}`}
                  className="mt-1 block text-sm text-fg-secondary transition-colors hover:text-accent"
                  dir="ltr"
                >
                  {siteConfig.contact.phone}
                </a>
                <p className="mt-1 text-xs text-fg-muted">شنبه تا چهارشنبه، ۹ تا ۱۸</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kid-coral-50 text-kid-coral-600">
                <MapPin className="size-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-fg-primary">آدرس</h3>
                <p className="mt-1 text-sm text-fg-secondary">
                  {siteConfig.contact.address}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  مراجعه فقط با هماهنگی قبلی
                </p>
              </div>
            </div>

            {/* Working hours */}
            <div className="rounded-2xl border border-app-border-subtle bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="size-5 text-kid-sunny-600" />
                <h3 className="font-bold text-fg-primary">ساعات کاری</h3>
              </div>
              <ul className="space-y-2 text-sm">
                {workingHours.map((w) => (
                  <li
                    key={w.day}
                    className="flex items-center justify-between border-b border-app-border-subtle pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-fg-secondary">{w.day}</span>
                    <span className="font-mono text-xs font-bold text-fg-primary" dir="ltr">
                      {w.hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="mb-3 font-bold text-fg-primary">ما رو در شبکه‌های اجتماعی دنبال کنید</h3>
              <div className="flex items-center gap-2">
                <a
                  href={siteConfig.social.instagram}
                  aria-label="اینستاگرام"
                  className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-kid-coral-100 to-kid-sunny-100 text-kid-coral-600 transition-transform hover:scale-110"
                >
                  <Instagram className="size-5" />
                </a>
                <a
                  href={siteConfig.social.telegram}
                  aria-label="تلگرام"
                  className="flex size-10 items-center justify-center rounded-xl bg-kid-sky-50 text-kid-sky-600 transition-transform hover:scale-110"
                >
                  <MessageCircle className="size-5" />
                </a>
                <a
                  href={siteConfig.social.youtube}
                  aria-label="یوتیوب"
                  className="flex size-10 items-center justify-center rounded-xl bg-kid-coral-50 text-kid-coral-600 transition-transform hover:scale-110"
                >
                  <Youtube className="size-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </Container>
    </main>
  );
}
