import type { Metadata } from "next";
import { Sparkles, Heart, Sun, BookOpen, Star } from "lucide-react";
import { gradients } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "تم کودکانه — پیش‌نمایش",
  robots: { index: false, follow: false },
};

/**
 * /kids-preview
 *
 * Internal design-system preview page. Renders the kid palette +
 * shadow/glow tokens so a designer or stakeholder can audit the
 * whole "kid surface" vocabulary in one place. Not linked from
 * the public nav.
 */
export default function KidsPreviewPage() {
  const swatches = [
    { name: "sky", note: "اعتماد + تخیل", className: "bg-kid-sky-400", hex: "#38BDF8" },
    { name: "coral", note: "گرما + امنیت", className: "bg-kid-coral-400", hex: "#FB7185" },
    { name: "mint", note: "رشد + تازگی", className: "bg-kid-mint-400", hex: "#34D399" },
    { name: "sunny", note: "شادی + موفقیت", className: "bg-kid-sunny-400", hex: "#FBBF24" },
    { name: "lavender", note: "آرامش + خلاقیت", className: "bg-kid-lavender-400", hex: "#A78BFA" },
    { name: "peach", note: "صمیمیت + خوش‌آمد", className: "bg-kid-peach-300", hex: "#FDBA74" },
  ];

  const cards = [
    { title: "مکالمه شجاعانه", glyph: "🦁", accent: "kid-sky", glow: "shadow-glowSky" },
    { title: "داستان‌های شاد", glyph: "📚", accent: "kid-coral", glow: "shadow-glowCoral" },
    { title: "گرامر آسان", glyph: "🌱", accent: "kid-mint", glow: "shadow-glowMint" },
    { title: "تلفظ درست", glyph: "🎯", accent: "kid-sunny", glow: "shadow-glowSunny" },
    { title: "لغت روزمره", glyph: "💡", accent: "kid-lavender", glow: "shadow-glowLavender" },
    { title: "شنیدن فعال", glyph: "🎧", accent: "kid-peach", glow: "shadow-squishy" },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <header className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-kid-coral-200 bg-kid-coral-50 px-4 py-2 text-sm font-bold text-kid-coral-600">
            <Sparkles className="size-4" />
            تم کودکانه
          </span>
          <h1 className="mt-4 bg-kid-text bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-5xl">
            رنگ‌هایی که کودکان دوست دارند
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-loose text-fg-secondary">
            یک پالت ۶ رنگ بر اساس روانشناسی رنگ که برای یادگیری، اعتماد
            و شادی کودکان طراحی شده. هر رنگ یک «چرا» دارد.
          </p>
        </header>

        {/* Swatches */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-fg-primary">پالت اصلی</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((s) => (
              <div
                key={s.name}
                className="overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm"
              >
                <div className={`h-20 ${s.className}`} />
                <div className="p-3">
                  <p className="text-sm font-bold capitalize text-fg-primary">{s.name}</p>
                  <p className="mt-0.5 text-xs text-fg-secondary">{s.note}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-fg-muted">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-fg-primary">گرادیان‌های کودکانه</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-24 rounded-2xl bg-kid-candy shadow-glowCoral" />
            <div className="h-24 rounded-2xl bg-kid-celebrate shadow-glowSunny" />
            <div className="h-24 rounded-2xl bg-kid-meadow shadow-glowMint" />
            <div className="h-24 rounded-2xl bg-kid-sky shadow-glowSky" />
            <div className="h-24 rounded-2xl bg-kid-sunrise shadow-squishy" />
            <div className="h-24 rounded-2xl bg-kid-candy-rtl shadow-glowLavender" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-fg-muted">
            <span>kid-candy</span>·<span>kid-celebrate</span>·<span>kid-meadow</span>·<span>kid-sky</span>·<span>kid-sunrise</span>·<span>kid-candy-rtl</span>
          </div>
        </section>

        {/* Sample cards */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-fg-primary">نمونه کارت‌ها</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <article
                key={c.title}
                className={`overflow-hidden rounded-2xl border border-app-border bg-surface p-5 transition-transform hover:-translate-y-1 ${c.glow}`}
              >
                <div className="mb-3 text-5xl">{c.glyph}</div>
                <h3 className="text-lg font-bold text-fg-primary">{c.title}</h3>
                <p className="mt-1 text-sm text-fg-secondary">
                  یک کارت نمونه برای نمایش پالت کودکانه
                </p>
                <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full bg-${c.accent}-100 px-3 py-1 text-xs font-bold text-${c.accent}-700`}>
                  <Star className="size-3" />
                  شروع یادگیری
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-fg-primary">دکمه‌ها</h2>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-kid-sky-500 px-6 py-3 text-sm font-bold text-white shadow-glowSky hover:bg-kid-sky-600">
              <BookOpen className="size-4" />
              شروع درس
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-kid-coral-500 px-6 py-3 text-sm font-bold text-white shadow-glowCoral hover:bg-kid-coral-600">
              <Heart className="size-4" />
              پسندیدم
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-kid-mint-500 px-6 py-3 text-sm font-bold text-white shadow-glowMint hover:bg-kid-mint-600">
              <Star className="size-4" />
              تکمیل شد
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-kid-sunny-500 px-6 py-3 text-sm font-bold text-white shadow-glowSunny hover:bg-kid-sunny-600">
              <Sun className="size-4" />
              جشن
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-kid-lavender-500 px-6 py-3 text-sm font-bold text-white shadow-glowLavender hover:bg-kid-lavender-600">
              <Sparkles className="size-4" />
              تخیل
            </button>
          </div>
        </section>

        {/* Usage */}
        <section className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-fg-primary">چطور استفاده کنم</h2>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100" dir="ltr">
{`// رنگ‌ها
<div className="bg-kid-sky-400 text-white">آسمان</div>
<div className="bg-kid-coral-100 text-kid-coral-700">مرجانی</div>

// گرادیان‌ها
<div className="bg-kid-candy">آبشار رنگ</div>
<div className="bg-kid-meadow">دشت</div>
<div className="bg-kid-sunrise">طلوع</div>

// سایه‌های رنگی
<button className="bg-kid-sky-500 shadow-glowSky">دکمه</button>
<button className="bg-kid-mint-500 shadow-glowMint">تأیید</button>
<button className="bg-kid-sunny-500 shadow-squishy">لمسی</button>`}
          </pre>
        </section>
      </div>
    </main>
  );
}
