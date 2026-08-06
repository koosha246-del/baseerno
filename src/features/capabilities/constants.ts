import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Presentation,
  Search,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface Capability {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  /** Kid-palette tone for the icon chip. */
  tone: "sky" | "coral" | "mint" | "sunny" | "lavender" | "peach";
  /** Featured cards span 2×2 on lg (hero tile of the grid). */
  featured?: boolean;
  /** Wide cards span 2 columns on lg. */
  wide?: boolean;
}

/**
 * Every real capability the platform ships — each tile links to a page
 * that actually exists, so visitors can click straight into the product.
 * The bento grid math (lg: 4 cols) is:
 *   featured AI 2×2 + 6 singles + 4 singles + 1 single + wide courses 2
 *   → 4 rows that fill exactly with no holes.
 */
export const capabilityItems: Capability[] = [
  {
    id: "ai-tutor",
    icon: Bot,
    title: "دستیار هوشمند یادگیری",
    description:
      "در هر درس، سؤال بپرس و جواب فوری بگیر — دقیقاً مثل یک معلم که کنارت نشسته. سؤال درباره‌ی هر جمله یا گرامر، هر زمان از شبانه‌روز.",
    href: "/courses",
    tone: "sky",
    featured: true,
  },
  {
    id: "certificates",
    icon: Award,
    title: "گواهی‌نامه پایان دوره",
    description: "بعد از اتمام هر دوره، گواهی رسمی قابل دانلود بگیر.",
    href: "/dashboard/certificates",
    tone: "mint",
  },
  {
    id: "grades",
    icon: ClipboardCheck,
    title: "آزمون و نمره‌دهی",
    description: "تمرین کن، آزمون بده و بازخورد شخصی مدرس را ببین.",
    href: "/dashboard/grades",
    tone: "coral",
  },
  {
    id: "library",
    icon: BookOpen,
    title: "کتابخانه‌ی دیجیتال",
    description: "کتاب‌های Setayesh — Milestones، Genius، Ace it!‌، Smart English، Smart plus.",
    href: "/library",
    tone: "sunny",
  },
  {
    id: "messages",
    icon: MessageSquare,
    title: "پیام و پشتیبانی",
    description: "با مدرس و هم‌کلاسی‌ها در ارتباط باش.",
    href: "/dashboard/messages",
    tone: "lavender",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "اعلان‌های لحظه‌ای",
    description: "نمره، پیام و رویدادها — بدون رفرش، زنده.",
    href: "/dashboard/notifications",
    tone: "peach",
  },
  {
    id: "progress",
    icon: TrendingUp,
    title: "پیشرفت و آمار",
    description: "مسیر یادگیری‌ات را قدم‌به‌قدم ببین.",
    href: "/dashboard",
    tone: "sky",
  },
  {
    id: "payments",
    icon: Wallet,
    title: "پرداخت امن",
    description: "ثبت‌نام و پرداخت آنلاین، با رسید شفاف.",
    href: "/dashboard/finance",
    tone: "sunny",
  },
  {
    id: "search",
    icon: Search,
    title: "جستجوی سریع درس‌ها",
    description: "با فیلتر و جستجو، درس مناسب را در چند ثانیه پیدا کن.",
    href: "/courses",
    tone: "lavender",
  },
  {
    id: "teacher",
    icon: Presentation,
    title: "پنل مدرس و محتوا",
    description: "درس بساز، مدیریت کن و پیشرفت دانش‌آموزها را دنبال کن.",
    href: "/dashboard/content",
    tone: "coral",
  },
  {
    id: "ops",
    icon: BarChart3,
    title: "آمار و عملیات",
    description: "سلامت سرویس، روند بار و گزارش‌های مدیریتی.",
    href: "/dashboard/ops",
    tone: "mint",
  },
  {
    id: "courses",
    icon: GraduationCap,
    title: "دوره‌های تخصصی",
    description: "گرامر، واژگان، شنیدن، نوشتن و آیلتس — همه‌چیز برای تسلط کامل.",
    href: "/courses",
    tone: "sky",
    wide: true,
  },
];
