import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";
import {
  GraduationCap,
  Target,
  Heart,
  Users,
  Award,
  BookOpen,
  Sparkles,
  Quote,
  Globe,
} from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "درباره ما",
  description: `آشنایی با آکادمی ${siteConfig.name} — تیم، تاریخچه و ماموریت ما برای آموزش زبان انگلیسی.`,
  path: "/about",
});

const values = [
  {
    icon: Target,
    title: "هدفمندی",
    desc: "هر دوره با هدف مشخص و نتیجه قابل اندازه‌گیری طراحی شده است. هر درس یک گام به جلو در یادگیری انگلیسی.",
  },
  {
    icon: Heart,
    title: "علاقه‌محوری",
    desc: "ما باور داریم آموزش با علاقه شروع می‌شود. وقتی از یادگیری لذت ببری، انگلیسی را سریع‌تر یاد می‌گیری.",
  },
  {
    icon: Users,
    title: "جامعه‌محوری",
    desc: "ما فقط آموزش نمی‌دهیم؛ یک شبکه از والدین، معلمان و دانش‌آموزان می‌سازیم که همدیگر را حمایت می‌کنند.",
  },
  {
    icon: Award,
    title: "کیفیت‌محوری",
    desc: "اساتید مجرب، کتاب‌های استاندارد Cambridge، بازخورد مستمر. هیچ بهانه‌ای برای کیفیت پایین قبول نمی‌کنیم.",
  },
];

const team = [
  {
    name: "سارا محمدی",
    role: "بنیان‌گذار و مدیرعامل",
    initial: "س",
    bio: "۱۲ سال تجربه در آموزش زبان انگلیسی. مدرک کارشناسی ارشد آموزش زبان از دانشگاه تهران.",
  },
  {
    name: "رضا کریمی",
    role: "مدیر آکادمیک",
    initial: "ر",
    bio: "طراح دوره‌ها و سرفصل‌ها. سابقه تدریس در مدارس بین‌المللی تهران. علاقه‌مند به یادگیری زبان از طریق بازی.",
  },
  {
    name: "نگار احمدی",
    role: "مدرس ارشد",
    initial: "ن",
    bio: "متخصص آموزش مکالمه و تلفظ انگلیسی. تدریس در ۴ کشور مختلف. سازنده متد «مکالمه با قصه».",
  },
  {
    name: "امیر حسینی",
    role: "مدرس واژگان",
    initial: "ا",
    bio: "زبان‌شناس و مدرس. کمک به زبان‌آموزان برای حفظ لغات با تکنیک‌های حافظه بلندمدت.",
  },
];

const stats = [
  { value: "+۱۲٬۰۰۰", label: "دانش‌آموز فعال" },
  { value: "+۸۰", label: "دوره تخصصی انگلیسی" },
  { value: "٪۹۶", label: "رضایت والدین" },
  { value: "۵+", label: "کتاب استاندارد بین‌المللی" },
];

export default function AboutPage() {
  return (
    <main className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="page">
        {/* Hero */}
        <section className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-kid-sky-100 px-4 py-1.5 text-sm font-semibold text-kid-sky-600">
            <GraduationCap className="size-4" />
            درباره ما
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-5xl">
            {siteConfig.name}، جایی که انگلیسی قدم به قدم یاد گرفتنیه
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-loose text-fg-secondary">
            ما از سال {siteConfig.foundedYear} کارمون رو با یه ایده ساده شروع کردیم:
            کمک کنیم هر کسی — کودک، نوجوان، بزرگسال — بتونه انگلیسی رو
            با روش درست، کتاب‌های استاندارد و اساتید مجرب یاد بگیره.
          </p>
        </section>

        {/* Why \"Baseer No\"? */}
        <section className="mb-16 rounded-3xl border border-kid-coral-200 bg-kid-coral-50 p-8 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-kid-coral-600">
                <Sparkles className="size-4" />
                چرا بصیر نو؟
              </span>
              <h2 className="font-display text-2xl font-extrabold text-fg-primary sm:text-3xl">
                «بصیر» یعنی بینا. «نو» یعنی تازه.
              </h2>
              <p className="mt-4 text-base leading-loose text-fg-secondary">
                ترکیبش می‌شه: «بینش تازه». دقیقاً کاریه که ما می‌کنیم — کمک می‌کنیم
                زبان‌آموزان جهان رو با چشم تازه‌ای ببینند، انگلیسی رو
                با روش درست یاد بگیرند، و به تسلط برسند.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-kid-sky-600">۱۲+</p>
                <p className="mt-1 text-xs text-fg-secondary">سال تجربه</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-kid-coral-600">۹۶٪</p>
                <p className="mt-1 text-xs text-fg-secondary">رضایت والدین</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-kid-mint-600">۸+</p>
                <p className="mt-1 text-xs text-fg-secondary">مدرس متخصص</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-kid-sunny-600">۵+</p>
                <p className="mt-1 text-xs text-fg-secondary">کتاب استاندارد Cambridge</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center gap-4">
            <h2 className="font-display text-2xl font-bold text-fg-primary">ماموریت ما</h2>
            <p className="text-base leading-loose text-fg-secondary">
              ما باور داریم هر کسی می‌تواند انگلیسی یاد بگیرد—به شرطی که مسیر
              درست را قدم به قدم طی کند. ماموریت ما فراهم کردن همین مسیر است:
              کتاب‌های استاندارد بین‌المللی، اساتید مجرب، و تمرین کافی.
            </p>
            <p className="text-base leading-loose text-fg-secondary">
              ما از مجموعه‌های Cambridge (Interchange و Connect) استفاده می‌کنیم
              — همان کتاب‌هایی که در بهترین آکادمی‌های زبان دنیا تدریس می‌شود.
              <span className="font-bold text-fg-primary"> ۷۰٪ زمان هر دوره تمرین عملی است</span>،
              نه فقط تماشای ویدیو.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="brand">
                <Link href="/courses">دیدن دوره‌ها</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">تماس با ما</Link>
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-lg">
            <Image
              src="/about/mission.jpg"
              alt="کلاس یادگیری زبان انگلیسی بصیر نو"
              width={800}
              height={600}
              className="h-80 w-full object-cover lg:h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-kid-sky-500/30 via-transparent to-transparent" />
            <div className="absolute bottom-4 right-4 flex size-16 items-center justify-center rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm">
              <Globe className="size-8 text-kid-sky-600" />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="mb-3 text-center font-display text-2xl font-bold text-fg-primary sm:text-3xl">
            ارزش‌های ما
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-fg-secondary">
            چهار اصل که تمام تصمیم‌های ما رو شکل می‌ده
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => {
              const Icon = v.icon;
              const palette = [
                "bg-kid-sky-50 text-kid-sky-600",
                "bg-kid-coral-50 text-kid-coral-600",
                "bg-kid-mint-50 text-kid-mint-600",
                "bg-kid-sunny-50 text-kid-sunny-600",
              ];
              return (
                <div
                  key={v.title}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-app-border-subtle bg-surface p-6 text-center transition-all duration-slow ease-luxury hover:-translate-y-1 hover:shadow-md"
                >
                  <span className={`flex size-14 items-center justify-center rounded-2xl ${palette[i]} transition-transform group-hover:scale-110`}>
                    <Icon className="size-7" />
                  </span>
                  <h3 className="font-display text-base font-bold text-fg-primary">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-secondary">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Method */}
        <section className="mb-16 rounded-3xl bg-kid-mint-50 p-8 sm:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-sm font-bold text-kid-mint-600 shadow-sm dark:bg-surface">
              <BookOpen className="size-4" />
              روش آموزشی ما
            </span>
            <h2 className="font-display text-2xl font-extrabold text-fg-primary sm:text-3xl">
              چهار مهارت، یک هدف
            </h2>
            <p className="mt-4 text-base leading-loose text-fg-secondary">
              هر دوره روی تقویت همزمان چهار مهارت اصلی تمرکز دارد:
              خواندن (Reading)، نوشتن (Writing)، شنیدن (Listening) و مکالمه (Speaking).
              با کتاب‌های استاندارد Cambridge و تمرین‌های هدفمند،
              انگلیسی را اصولی و ماندگار یاد می‌گیری.
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="mb-3 text-center font-display text-2xl font-bold text-fg-primary sm:text-3xl">
            تیم ما
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-fg-secondary">
            آدم‌هایی که پشت هر درس و هر بازخورد هستند
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center gap-3 rounded-2xl border border-app-border-subtle bg-surface p-6 text-center"
              >
                <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-extrabold text-white shadow-glow">
                  {m.initial}
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-fg-primary">{m.name}</h3>
                  <p className="mt-0.5 text-xs text-kid-coral-600">{m.role}</p>
                </div>
                <p className="text-xs leading-relaxed text-fg-secondary">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section className="mb-16 rounded-3xl bg-kid-sky-50 p-8 sm:p-12">
          <Quote className="mx-auto size-10 text-kid-sky-500" />
          <blockquote className="mt-4 text-center font-display text-xl font-bold leading-relaxed text-fg-primary sm:text-2xl">
            «ما باور داریم هر کسی — در هر سنی — می‌تواند انگلیسی یاد بگیرد.
            فقط کافی است مسیر درست را قدم به قدم طی کند.»
          </blockquote>
          <p className="mt-4 text-center text-sm text-fg-secondary">
            — سارا محمدی، بنیان‌گذار بصیر نو
          </p>
        </section>

        {/* Stats */}
        <section className="rounded-3xl bg-brand-gradient p-8 text-center text-white sm:p-12">
          <h2 className="mb-8 font-display text-2xl font-bold">به اعداد اعتماد کنید</h2>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <span className="block text-3xl font-extrabold sm:text-4xl">{s.value}</span>
                <span className="mt-1 text-sm text-white/80">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <h2 className="font-display text-2xl font-bold text-fg-primary">
            آماده‌ای شروع کنی؟
          </h2>
          <p className="mx-auto mt-3 max-w-md text-fg-secondary">
            اولین درس رایگانه. بدون تعهد، بدون کارت.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="brand" size="lg">
              <Link href="/register">ثبت‌نام رایگان</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/courses">دیدن دوره‌ها</Link>
            </Button>
          </div>
        </section>
      </Container>
    </main>
  );
}
