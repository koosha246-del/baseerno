import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";
import { GraduationCap, Target, Heart, Users, Award, Mic } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره ما",
  description: `آشنایی با آکادمی ${siteConfig.name}، مسیر حرفه‌ای شدن در فن بیان و ارتباط مؤثر.`,
};

const values = [
  {
    icon: Target,
    title: "هدفمندی",
    desc: "هر دوره با هدف مشخص و نتیجه قابل اندازه‌گیری طراحی شده است.",
  },
  {
    icon: Heart,
    title: "علاقه‌محوری",
    desc: "آموزش با علاقه شروع می‌شود و با تمرین به مهارت تبدیل می‌شود.",
  },
  {
    icon: Users,
    title: "جامعه‌سازی",
    desc: "ما فقط آموزش نمی‌دهیم؛ یک شبکه حرفه‌ای از سخنوران می‌سازیم.",
  },
  {
    icon: Award,
    title: "کیفیت‌محوری",
    desc: "اساتید مجرب، محتوای ساختارمند و پشتیبانی مستمر.",
  },
];

export default function AboutPage() {
  return (
    <main className="pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="page">
        {/* Hero */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent">
            <GraduationCap className="size-4" />
            درباره ما
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-4xl">
            آکادمی {siteConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-fg-secondary">
            از سال {siteConfig.foundedYear}، ما در مسیر توانمندسازی افراد برای بیان بهتر،
            ارتباط مؤثرتر و سخنرانی حرفه‌ای‌تر گام برمی‌داریم.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center gap-4">
            <h2 className="font-display text-2xl font-bold text-fg-primary">ماموریت ما</h2>
            <p className="text-base leading-loose text-fg-secondary">
              ما باور داریم که هر انسانی صدایی منحصربه‌فرد دارد. ماموریت ما کشف، پرورش و
              تقویت این صداست تا هر کسی بتواند با اعتماد به نفس، اثرگذار و الهام‌بخش صحبت کند.
            </p>
            <p className="text-base leading-loose text-fg-secondary">
              ترکیب علم ارتباطات، روانشناسی و تمرینات عملی، رمز موفقیت ماست. ما به
              &quot;یادگیری با انجام دادن&quot; باور داریم.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-lg">
            <Image
              src="/about/mission.jpg"
              alt="سخنرانی حرفه‌ای"
              width={800}
              height={600}
              className="h-80 w-full object-cover lg:h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/30 via-transparent to-transparent" />
            <div className="absolute bottom-4 right-4 flex size-16 items-center justify-center rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm">
              <Mic className="size-8 text-accent" />
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-fg-primary">
            ارزش‌های ما
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-app-border-subtle bg-surface p-6 text-center transition-all duration-slow ease-luxury hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-display text-base font-bold text-fg-primary">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-secondary">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-brand-gradient p-8 text-center text-white sm:p-12">
          <h2 className="mb-8 font-display text-2xl font-bold">به اعداد اعتماد کنید</h2>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <span className="block text-3xl font-extrabold">+۱۲٬۰۰۰</span>
              <span className="text-sm text-white/80">دانشجو</span>
            </div>
            <div>
              <span className="block text-3xl font-extrabold">+۸۰</span>
              <span className="text-sm text-white/80">دوره تخصصی</span>
            </div>
            <div>
              <span className="block text-3xl font-extrabold">٪۹۶</span>
              <span className="text-sm text-white/80">رضایت</span>
            </div>
            <div>
              <span className="block text-3xl font-extrabold">+۵۰</span>
              <span className="text-sm text-white/80">سازمان همکار</span>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
