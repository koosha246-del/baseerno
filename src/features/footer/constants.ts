import { siteConfig } from "@/config/site";
import type { FooterLinkGroup, FooterSocial } from "./types";

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    id: "courses",
    title: "دوره‌ها",
    links: [
      { label: "فن بیان", href: "#courses" },
      { label: "ارائه و سخنرانی", href: "#courses" },
      { label: "ارتباط مؤثر", href: "#courses" },
      { label: "آواسازی", href: "#courses" },
      { label: "داستان‌گویی", href: "#courses" },
    ],
  },
  {
    id: "about",
    title: "درباره ما",
    links: [
      { label: "معرفی آکادمی", href: "/about" },
      { label: "اساتید", href: "/about" },
      { label: "بلاگ", href: "#" },
      { label: "نظرات دانشجویان", href: "#achievements" },
      { label: "تماس با ما", href: "/contact" },
    ],
  },
  {
    id: "support",
    title: "پشتیبانی",
    links: [
      { label: "سوالات متداول", href: "#faq" },
      { label: "قوانین و مقررات", href: "/terms" },
      { label: "حریم خصوصی", href: "/privacy" },
      { label: "شرایط بازگشت وجه", href: "/terms" },
      { label: "آموزش سازمانی", href: "#corporate" },
    ],
  },
];

/**
 * Footer socials — store platform key only (serializable).
 * FooterSocial (client) resolves the Lucide icon from a local map.
 */
export const footerSocials: FooterSocial[] = [
  { id: "instagram", platform: "اینستاگرام", href: siteConfig.social.instagram },
  { id: "telegram", platform: "تلگرام", href: siteConfig.social.telegram },
  { id: "youtube", platform: "یوتیوب", href: siteConfig.social.youtube },
  { id: "linkedin", platform: "لینکدین", href: siteConfig.social.linkedin },
  { id: "aparat", platform: "آپارات", href: siteConfig.social.aparat },
];
