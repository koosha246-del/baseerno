import type { HeroData, CarouselSlide } from "./types";

/**
 * Hero copy — simple Persian for school students.
 * Color psychology on slides: green = growth, blue = calm focus, teal = fresh energy.
 */
export const heroData: HeroData = {
  badge: "یادگیری انگلیسی، آسان و شاد",
  titleLead: "انگلیسی را",
  titleHighlight: "ساده و قدم‌به‌قدم",
  titleTail: "یاد بگیر",
  description:
    "اینجا برای دانش‌آموزان است. درس‌های کوتاه، تمرین‌های آسان و مسیر روشن — تا بدون استرس انگلیسی را یاد بگیری.",
  primaryCta: {
    label: "درس‌ها را ببین",
    href: "#courses",
  },
  secondaryCta: {
    label: "چطور کار می‌کند؟",
    href: "#corporate",
  },
  stats: [
    { value: "+۹٬۰۰۰", label: "دانش‌آموز" },
    { value: "۴۰+", label: "درس" },
    { value: "۱۴۰۳", label: "شروع" },
  ],
  features: [
    { icon: "Mic", title: "تمرین حرف زدن" },
    { icon: "Award", title: "گواهی پایان" },
    { icon: "Users", title: "کمک معلم" },
  ],
};

/**
 * Carousel themes follow color psychology for kids' learning:
 * green → growth & progress · blue → calm focus · teal → fresh energy
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
    label: "رشد هر روزه (سبز = پیشرفت)",
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
    href: "#courses",
    label: "آرامش برای درس (آبی = تمرکز)",
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
    label: "شروع تازه (فیروزه‌ای = انرژی)",
    durationMs: 20_000,
  },
  {
    // Kid-friendly slide — leads the rotation so children see
    // candy colors first. Color psychology: sky=trust, coral=warmth,
    // mint=growth, sunny=joy. scrim is lighter so the photo still reads.
    id: "kid-candy",
    src: "/carousel/slide-1.jpg",
    placeholderColor: "#38BDF8",
    theme: {
      accent: "#FB7185",
      accentHover: "#F43F5E",
      accentSoft: "#FFE4E6",
      textGradient: "linear-gradient(120deg, #0EA5E9 0%, #F43F5E 40%, #F59E0B 70%, #FBBF24 100%)",
      brandGradient: "linear-gradient(90deg, #38BDF8 0%, #A78BFA 35%, #FB7185 65%, #FBBF24 100%)",
      scrimColor: "rgba(56, 189, 248, 0.25)",
    },
    href: "#courses",
    label: "دنیای کودکان",
    durationMs: 20_000,
  },
];
