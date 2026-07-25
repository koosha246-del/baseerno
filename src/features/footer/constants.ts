import { siteConfig } from "@/config/site";
import type { FooterLinkGroup, FooterSocial } from "./types";

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    id: "courses",
    title: "درس‌ها",
    links: [
      { label: "همه دوره‌ها", href: "/courses" },
      { label: "انگلیسی از صفر", href: "/courses" },
      { label: "گرامر آسان", href: "/courses" },
      { label: "مکالمه", href: "/courses" },
      { label: "آمادگی آیلتس", href: "/courses" },
    ],
  },
  {
    id: "about",
    title: "درباره ما",
    links: [
      { label: "معرفی بصیر نو", href: "/about" },
      { label: "دوره‌ها", href: "/courses" },
      { label: "نکته‌های یادگیری", href: "#" },
      { label: "نظر دانش‌آموزان", href: "/about" },
      { label: "تماس با ما", href: "/contact" },
    ],
  },
  {
    id: "support",
    title: "کمک و پشتیبانی",
    links: [
      { label: "سوالات", href: "/contact" },
      { label: "قوانین", href: "/terms" },
      { label: "حریم خصوصی", href: "/privacy" },
      { label: "بازگشت وجه", href: "/terms" },
      { label: "تماس با ما", href: "/contact" },
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
