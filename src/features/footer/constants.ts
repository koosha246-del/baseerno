import { siteConfig } from "@/config/site";
import type { FooterLinkGroup, FooterSocial } from "./types";

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    id: "courses",
    title: "درس‌ها",
    links: [
      { label: "انگلیسی از صفر", href: "#courses" },
      { label: "گرامر آسان", href: "#courses" },
      { label: "مکالمه", href: "#courses" },
      { label: "شنیدن و تلفظ", href: "#courses" },
      { label: "داستان‌های انگلیسی", href: "#courses" },
    ],
  },
  {
    id: "about",
    title: "درباره ما",
    links: [
      { label: "معرفی بصیر نو", href: "/about" },
      { label: "معلم‌ها", href: "/about" },
      { label: "نکته‌های یادگیری", href: "#" },
      { label: "نظر دانش‌آموزان", href: "#achievements" },
      { label: "تماس با ما", href: "/contact" },
    ],
  },
  {
    id: "support",
    title: "کمک و پشتیبانی",
    links: [
      { label: "سوالات", href: "#faq" },
      { label: "قوانین", href: "/terms" },
      { label: "حریم خصوصی", href: "/privacy" },
      { label: "بازگشت وجه", href: "/terms" },
      { label: "کلاس گروهی", href: "#corporate" },
    ],
  },
];

export const footerSocials: FooterSocial[] = [
  { id: "instagram", platform: "اینستاگرام", href: siteConfig.social.instagram },
  { id: "telegram", platform: "تلگرام", href: siteConfig.social.telegram },
  { id: "youtube", platform: "یوتیوب", href: siteConfig.social.youtube },
  { id: "linkedin", platform: "لینکدین", href: siteConfig.social.linkedin },
  { id: "aparat", platform: "آپارات", href: siteConfig.social.aparat },
];
