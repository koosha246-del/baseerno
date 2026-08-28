import { navigation, headerCta } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import type { HeaderData, Announcement } from "./types";

/**
 * Header feature data — derived from the central navigation + site config
 * so the header never drifts from the rest of the app.
 *
 * Icons are stored as serializable string keys (resolved client-side) to
 * keep this server module's exports safe across the server/client boundary.
 */
export const headerData: HeaderData = {
  logoText: siteConfig.name,
  logoSub: siteConfig.tagline,
  nav: navigation.map((item) => ({
    id: item.id,
    label: item.label,
    // "home" is a route, not an anchor — the homepage has no #home
    // section, so a bare `#home` href was a dead link.
    href: item.id === "home" ? "/" : `#${item.id}`,
  })),
  cta: {
    label: headerCta.label,
    href: headerCta.href,
    iconKey: "graduation-cap",
  },
};

/** Phone CTA shown on desktop (contact shortcut). */
export const headerPhone = {
  label: "کمک میخوای؟",
  href: "tel:" + siteConfig.contact.phoneHref,
  iconKey: "phone" as const,
  display: siteConfig.contact.phone,
};

/**
 * Announcement bar — shown at the very top of the header.
 * Set to null to hide the announcement bar.
 */
export const announcement: Announcement | null = {
  text: "🔥 اولین درس هر دوره رایگانه — همین الان شروع کن!",
  href: "/courses",
  tone: "sky",
};

/** Social media links for the header. */
export const socialLinks = [
  { label: "Instagram", href: siteConfig.social.instagram, iconKey: "instagram" },
  { label: "Telegram", href: siteConfig.social.telegram, iconKey: "telegram" },
  { label: "YouTube", href: siteConfig.social.youtube, iconKey: "youtube" },
  { label: "LinkedIn", href: siteConfig.social.linkedin, iconKey: "linkedin" },
] as const;
