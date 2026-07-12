/**
 * Central site configuration — typed, editable, the single place to change
 * brand identity, contact info, and navigation.
 */
export const siteConfig = {
  name: "بصیر نو",
  nameEn: "Baseer No",
  shortName: "بصیر نو",
  tagline: "آکادمی مهارت‌های بیان و ارتباط مؤثر",
  description:
    "آکادمی بصیر نو، مسیر حرفه‌ای شدن در فن بیان، سخنرانی و ارتباط مؤثر. دوره‌های تخصصی، آموزش حضوری و سازمانی با اساتید برتر ایران.",
  url: "https://baseerno.ir",
  locale: "fa_IR",
  lang: "fa",
  dir: "rtl" as const,
  foundedYear: 1398,
  contact: {
    email: "info@baseerno.ir",
    phone: "۰۹۳۰-۷۷۲-۵۴۸۴",
    phoneHref: "+989307725484",
    address: "تهران، خیابان ولیعصر، برج پارسیان، طبقه ۸",
  },
  social: {
    instagram: "https://instagram.com/baseerno",
    telegram: "https://t.me/baseerno",
    youtube: "https://youtube.com/@baseerno",
    linkedin: "https://linkedin.com/company/baseerno",
    aparat: "https://aparat.com/baseerno",
  },
} as const;

export type SiteConfig = typeof siteConfig;
