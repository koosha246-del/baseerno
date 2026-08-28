import Link from "next/link";
import { Instagram, MapPin, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { navItems, siteConfig } from "@/lib/site-config";

/** لینک‌های دسترسی سریع فوتر */
const quickLinks = [
  { label: "مسیر یادگیری", href: "#journey" },
  { label: "منابع آموزشی", href: "#books" },
  { label: "دوره‌ها", href: "#courses" },
  { label: "درباره ما", href: "#about" },
  { label: "سوالات متداول", href: "#faq" },
];

/** لینک‌های اپلیکیشن — مسیرهای واقعی سایت */
const appLinks = [
  { label: "همه دوره‌ها", href: "/courses" },
  { label: "کتابخانه", href: "/library" },
  { label: "تماس با ما", href: "/contact" },
  { label: "ورود به حساب", href: "/login" },
  { label: "ثبت‌نام", href: "/register" },
];

/**
 * فوتر — ساده، تمیز و جمع‌وجمور
 */
export function SiteFooter() {
  const { contact } = siteConfig;

  return (
    <footer id="contact" className="bg-navy-deep text-blue-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 py-16 md:grid-cols-12 md:gap-8">
          {/* برند */}
          <div className="md:col-span-4">
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-[15px] leading-8 text-blue-100/80">
              آموزش زبان انگلیسی برای کودکان و نوجوانان؛ با مسیر آموزشی
              مشخص، تعیین سطح و منابع استاندارد.
            </p>

            {/* اینستاگرام — واقعی، از تابلوی آموزشگاه */}
            <a
              href={contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              <Instagram aria-hidden="true" className="size-4" />
              <span dir="ltr">@{contact.instagramHandle}</span>
            </a>
          </div>

          {/* دسترسی سریع */}
          <nav aria-label="دسترسی سریع" className="md:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-100/50">
              دسترسی سریع
            </h3>
            <ul className="mt-5 space-y-3.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[15px] font-semibold text-blue-100/85 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* اپلیکیشن — مسیرهای واقعی */}
          <nav aria-label="اپلیکیشن" className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-100/50">
              اپلیکیشن
            </h3>
            <ul className="mt-5 space-y-3.5">
              {appLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] font-semibold text-blue-100/85 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* تماس و ثبت‌نام */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-100/50">
              شروع یادگیری
            </h3>
            <p className="mt-5 text-[15px] leading-8 text-blue-100/70">
              برای تعیین سطح و ثبت‌نام، همین حالا اقدام کنید؛ اولین قدم را
              با هم برمی‌داریم.
            </p>

            {/* اطلاعات تماس — فقط در صورت وجود داده واقعی نمایش داده می‌شود */}
            <ul className="mt-4 space-y-2.5">
              {contact.phone ? (
                <li className="flex items-center gap-2 text-[15px] font-semibold text-blue-100/85">
                  <Phone aria-hidden="true" className="size-4 shrink-0 text-sun" />
                  <a
                    href={`tel:${contact.phoneHref ?? contact.phone.replace(/[^+\d]/g, "")}`}
                    className="transition-colors hover:text-white"
                  >
                    <span dir="ltr">{contact.phone}</span>
                  </a>
                </li>
              ) : null}
              {contact.address ? (
                <li className="flex items-start gap-2 text-[15px] font-semibold text-blue-100/85">
                  <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-sun" />
                  <span>{contact.address}</span>
                </li>
              ) : null}
            </ul>

            <Button asChild variant="sun" size="xl" className="mt-6 w-full md:w-auto">
              <a href={siteConfig.primaryCta.href}>
                {siteConfig.primaryCta.label}
                <ArrowLeft aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>

        {/* نوار پایانی */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-sm text-blue-100/70 sm:flex-row">
          <p>© {siteConfig.name} — تمامی حقوق محفوظ است.</p>
          <Link
            href="#top"
            className="rounded-lg px-2 py-1 font-semibold transition-colors hover:text-white"
          >
            بازگشت به بالا
          </Link>
        </div>
      </div>
    </footer>
  );
}
