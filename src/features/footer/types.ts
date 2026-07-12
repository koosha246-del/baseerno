import type { LucideIcon } from "lucide-react";

export interface FooterLinkGroup {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  href: string;
}

export type FooterSocialPlatform =
  | "instagram"
  | "telegram"
  | "youtube"
  | "linkedin"
  | "aparat";

export interface FooterSocial {
  id: FooterSocialPlatform;
  platform: string;
  href: string;
  /** Icon resolved client-side via a local map. Kept optional for serializable data. */
  icon?: LucideIcon;
}
