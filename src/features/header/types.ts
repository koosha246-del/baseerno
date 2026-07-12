export interface HeaderNavItem {
  id: string;
  label: string;
  href: string;
}

export type HeaderCtaIconKey = "graduation-cap" | "phone";

export interface HeaderCta {
  label: string;
  href: string;
  iconKey?: HeaderCtaIconKey;
}

export interface HeaderData {
  logoText: string;
  logoSub: string;
  nav: HeaderNavItem[];
  cta: HeaderCta;
}
