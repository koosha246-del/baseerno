export interface BrandLogo {
  /** Short label rendered inside the logo wordmark. */
  name: string;
  /** Optional tagline beneath the wordmark. */
  tagline?: string;
}

/**
 * Trusted brands shown in the infinite marquee (section #4).
 *
 * Brand logos are rendered as styled wordmarks (no external SVG dependency)
 * so the strip is crisp, themeable, and has zero layout shift.
 */
export const trustedBrands: BrandLogo[] = [
  { name: "بانک ملت", tagline: "Bank Mellat" },
  { name: "ایران‌خودرو", tagline: "Iran Khodro" },
  { name: "همشهری", tagline: "Hamshahri" },
  { name: "دیجی‌کالا", tagline: "Digikala" },
  { name: "اسنپ", tagline: "Snapp" },
  { name: "شتاب‌دهنده مونتاژ", tagline: "Montaj" },
  { name: "تپسی", tagline: "Tapsi" },
  { name: "بانک پاسارگاد", tagline: "Pasargad" },
];
