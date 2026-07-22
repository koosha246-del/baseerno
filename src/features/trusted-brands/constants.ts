export interface BrandLogo {
  /** Short label rendered inside the logo wordmark. */
  name: string;
  /** Optional tagline beneath the wordmark. */
  tagline?: string;
}

/**
 * Partner schools / learning names — simple wordmarks (not corporate brands).
 */
export const trustedBrands: BrandLogo[] = [
  { name: "مدرسه امید", tagline: "Omid School" },
  { name: "دبیرستان نور", tagline: "Noor High" },
  { name: "کانون دانش", tagline: "Danesh" },
  { name: "آموزشگاه سپهر", tagline: "Sepehr" },
  { name: "مدرسه آفتاب", tagline: "Aftab" },
  { name: "مرکز زبان پارس", tagline: "Pars English" },
  { name: "مدرسه بهار", tagline: "Bahar" },
  { name: "کلاس‌های روشن", tagline: "Roshan" },
];
