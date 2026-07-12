import type { HeroData, CarouselSlide } from "./types";

/**
 * Hero feature data — Persian copy for the hero section.
 * Title uses a highlighted gradient fragment for emphasis.
 */
export const heroData: HeroData = {
  badge: "آکادمی فن بیان و ارتباط",
  titleLead: "صحبت کردن",
  titleHighlight: "یک مهارت است",
  titleTail: "که می‌توان یاد گرفت",
  description:
    "خیلی‌ها فکر می‌کنند فن بیان یک استعداد ذاتی است. در آکادمی بصیر نو به شما نشان می‌دهیم که چطور با تمرین درست و بازخورد مستمر، صدای خودت را پیدا کنی و در هر جمعی با اطمینان صحبت کنی.",
  primaryCta: {
    label: "دوره‌ها را ببین",
    href: "#courses",
  },
  secondaryCta: {
    label: "با ما صحبت کن",
    href: "#corporate",
  },
  stats: [
    { value: "+۹٬۰۰۰", label: "دانشجو" },
    { value: "۴۰+", label: "دوره" },
    { value: "۱۴۰۳", label: "تأسیس" },
  ],
  features: [
    { icon: "Mic", title: "تمرین عملی" },
    { icon: "Award", title: "گواهی پایان دوره" },
    { icon: "Users", title: "بازخورد اساتید" },
  ],
};

/**
 * Background carousel slides — local images for fast, offline-first delivery.
 * Per-slide theme switching keeps the brand aligned with each slide's mood.
 */
export const carouselSlides: CarouselSlide[] = [
  {
    id: "green-growth",
    src: "/carousel/slide-1.jpg",
    placeholderColor: "#0a4a2e",
    theme: {
      accent: "#10B981",
      accentHover: "#059669",
      accentSoft: "#ECFDF5",
      textGradient: "linear-gradient(120deg, #065F46 0%, #10B981 40%, #34D399 70%, #6EE7B7 100%)",
      brandGradient: "linear-gradient(90deg, #065F46 0%, #10B981 50%, #34D399 100%)",
      scrimColor: "rgba(6, 95, 70, 0.45)",
    },
    href: "#courses",
    label: "رشد و پیشرفت",
    durationMs: 20_000,
  },
  {
    id: "blue-optimistic",
    src: "/carousel/slide-2.jpg",
    placeholderColor: "#1e3a5f",
    theme: {
      accent: "#1B4FD4",
      accentHover: "#153AA8",
      accentSoft: "#E8EDF8",
      textGradient: "linear-gradient(120deg, #1E3A5F 0%, #1B4FD4 40%, #3B82F6 70%, #60A5FA 100%)",
      brandGradient: "linear-gradient(90deg, #1E3A5F 0%, #1B4FD4 50%, #3B82F6 100%)",
      scrimColor: "rgba(30, 58, 95, 0.45)",
    },
    href: "#corporate",
    label: "آموزش جهانی",
    durationMs: 20_000,
  },
  {
    id: "teal-classic",
    src: "/carousel/slide-3.jpg",
    placeholderColor: "#1a3c3a",
    theme: {
      accent: "#0D9488",
      accentHover: "#0F766E",
      accentSoft: "#F0FDFA",
      textGradient: "linear-gradient(120deg, #134E4A 0%, #0D9488 40%, #14B8A6 70%, #2DD4BF 100%)",
      brandGradient: "linear-gradient(90deg, #134E4A 0%, #0D9488 50%, #14B8A6 100%)",
      scrimColor: "rgba(19, 78, 74, 0.45)",
    },
    href: "#courses",
    label: "کلاسیک آکادمیک",
    durationMs: 20_000,
  },
];
