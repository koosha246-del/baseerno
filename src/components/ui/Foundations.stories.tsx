import type { Meta } from "@storybook/react";
import { kidColors } from "@/lib/design-tokens";

/**
 * Foundations — design tokens, kid-friendly palette, brand gradients.
 * This is the source of truth for colors used across the بصیر نو UI.
 */
const meta: Meta = {
  title: "Foundations",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

/* ------------------------------------------------------------------
 * Brand color tokens (adult/professional surfaces)
 * ----------------------------------------------------------------- */
const brandSwatches = [
  { name: "brand-navy", token: "--brand-navy", value: "#1e3a5f" },
  { name: "brand-blue", token: "--brand-blue", value: "#2563eb" },
  { name: "brand-amber", token: "--brand-amber", value: "#d4a017" },
  { name: "brand-gold", token: "--brand-gold", value: "#f5c518" },
  { name: "accent", token: "--theme-accent", value: "#1b4fd4" },
  { name: "success", token: "status-success", value: "#22c55e" },
  { name: "warning", token: "status-warning", value: "#f59e0b" },
  { name: "danger", token: "status-danger", value: "#ef4444" },
];

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-sm">
      <div
        className="h-20 w-full"
        style={{ backgroundColor: value }}
        aria-label={`${name} = ${value}`}
      />
      <div className="p-3">
        <p className="font-mono text-xs font-semibold text-fg-primary">{name}</p>
        <p className="font-mono text-[10px] text-fg-muted" dir="ltr">
          {value}
        </p>
      </div>
    </div>
  );
}

export const BrandColors: Meta = {
  render: () => (
    <div className="space-y-4 p-8">
      <header>
        <h1 className="text-2xl font-bold text-fg-primary">رنگ‌های برند</h1>
        <p className="text-sm text-fg-secondary">
          پالت اصلی برای سطوح حرفه‌ای، CTA و آیکون‌ها.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {brandSwatches.map((s) => (
          <Swatch key={s.name} name={s.name} value={s.value} />
        ))}
      </div>
    </div>
  ),
};

/* ------------------------------------------------------------------
 * Kid-friendly palette — child-facing surfaces
 * ----------------------------------------------------------------- */
const kidPalettes = [
  { name: "sky", label: "آسمان", description: "آرامش، اعتماد" },
  { name: "coral", label: "مرجانی", description: "انرژی، شادی" },
  { name: "mint", label: "نعناعی", description: "رشد، تازگی" },
  { name: "sunny", label: "آفتابی", description: "شادی، امید" },
  { name: "lavender", label: "اسطوخودوسی", description: "خلاقیت" },
  { name: "peach", label: "هلویی", description: "گرما، مهربانی" },
];

const kidShades = [50, 100, 200, 300, 400, 500, 600] as const;

export const KidPalette: Meta = {
  render: () => (
    <div className="space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold text-fg-primary">پالت کودکانه</h1>
        <p className="text-sm text-fg-secondary">
          رنگ‌های گرم و شاد برای رابط‌های مخصوص کودکان.
        </p>
      </header>
      <div className="space-y-5">
        {kidPalettes.map((palette) => (
          <div key={palette.name}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="font-display text-base font-bold text-fg-primary">
                {palette.label}
              </h2>
              <span className="text-xs text-fg-muted">kid-{palette.name}</span>
              <span className="text-xs text-fg-secondary">
                · {palette.description}
              </span>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-app-border">
              {kidShades.map((shade) => {
                const color = (
                  kidColors as Record<string, Record<string, string>>
                )[palette.name]?.[shade];
                if (!color) return null;
                return (
                  <div
                    key={shade}
                    className="flex h-20 flex-1 flex-col items-center justify-end p-2"
                    style={{ backgroundColor: color }}
                  >
                    <span
                      className={`font-mono text-[10px] ${
                        shade >= 400 ? "text-white" : "text-fg-primary"
                      }`}
                    >
                      {shade}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

/* ------------------------------------------------------------------
 * Brand & kid gradients
 * ----------------------------------------------------------------- */
const gradientSamples = [
  { name: "brand", label: "برند", className: "bg-brand-gradient" },
  { name: "brand-soft", label: "برند ملایم", className: "bg-brand-soft" },
  { name: "aurora", label: "شفق", className: "bg-aurora" },
  { name: "text-gradient", label: "گرادینت متن", className: "bg-text-gradient" },
  { name: "kid-candy", label: "کودک · آب‌نبات", className: "bg-kid-candy" },
  { name: "kid-sky", label: "کودک · آسمان", className: "bg-kid-sky" },
  { name: "kid-meadow", label: "کودک · چمنزار", className: "bg-kid-meadow" },
  { name: "kid-sunrise", label: "کودک · طلوع", className: "bg-kid-sunrise" },
  { name: "kid-celebrate", label: "کودک · جشن", className: "bg-kid-celebrate" },
];

export const Gradients: Meta = {
  render: () => (
    <div className="space-y-4 p-8">
      <header>
        <h1 className="text-2xl font-bold text-fg-primary">گرادینت‌ها</h1>
        <p className="text-sm text-fg-secondary">
          سطوح برند و کودکانه — هر کدام حس و کاربرد متفاوتی دارند.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gradientSamples.map((g) => (
          <div
            key={g.name}
            className="overflow-hidden rounded-xl border border-app-border"
          >
            <div className={`h-32 w-full ${g.className}`} />
            <div className="bg-surface p-3">
              <p className="font-mono text-xs font-semibold text-fg-primary">
                {g.name}
              </p>
              <p className="text-xs text-fg-secondary">{g.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

/* ------------------------------------------------------------------
 * Typography scale
 * ----------------------------------------------------------------- */
const typeSamples = [
  { token: "display-hero", size: "text-display-hero", label: "Display Hero" },
  { token: "hero", size: "text-hero", label: "Hero" },
  { token: "section-title", size: "text-section-title", label: "Section Title" },
  { token: "card-title", size: "text-card-title", label: "Card Title" },
  { token: "subtitle", size: "text-subtitle", label: "Subtitle" },
  { token: "lead", size: "text-lead", label: "Lead" },
  { token: "body-lg", size: "text-body-lg", label: "Body Large" },
  { token: "body", size: "text-body", label: "Body" },
  { token: "body-sm", size: "text-body-sm", label: "Body Small" },
  { token: "caption", size: "text-caption", label: "Caption" },
];

export const Typography: Meta = {
  render: () => (
    <div className="space-y-4 p-8">
      <header>
        <h1 className="text-2xl font-bold text-fg-primary">تایپوگرافی</h1>
        <p className="text-sm text-fg-secondary">
          سیستم مقیاس متن بصیر نو — Vazirmatn با RTL طبیعی.
        </p>
      </header>
      <div className="space-y-3">
        {typeSamples.map((t) => (
          <div
            key={t.token}
            className="flex items-baseline gap-4 border-b border-app-border-subtle pb-2"
          >
            <span className="w-32 shrink-0 font-mono text-xs text-fg-muted" dir="ltr">
              {t.token}
            </span>
            <p className={`flex-1 text-fg-primary ${t.size}`}>
              {t.label} — یادگیری زبان انگلیسی
            </p>
          </div>
        ))}
      </div>
    </div>
  ),
};
