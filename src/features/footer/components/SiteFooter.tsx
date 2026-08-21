import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/shared/Container";
import { Logo } from "@/features/header/components/Logo";
import { FooterColumns } from "./FooterColumns";
import { FooterSocial } from "./FooterSocial";
import { FooterNewsletter } from "./FooterNewsletter";
import { siteConfig } from "@/config/site";

/**
 * SiteFooter — section #9 (final homepage section).
 *
 * Multi-column layout: logo + newsletter, link groups, social icons,
 * copyright bar. Branded and RTL-consistent.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-fg-primary bg-surface-muted">
      <div aria-hidden className="absolute left-[-3rem] top-[-3rem] size-40 rounded-full bg-kid-sunny-200/60" />
      <div aria-hidden className="absolute bottom-8 right-[-2rem] h-20 w-44 rotate-6 rounded-[50%] bg-kid-mint-200/60" />
      <Container width="page" className="relative py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-8">
          {/* Brand + newsletter */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <Logo showSub />
            <FooterSocial />
            <FooterNewsletter />
          </div>

          {/* Link columns */}
          <div className="lg:col-span-3">
            <FooterColumns />
          </div>
        </div>
      </Container>

      <Separator />

      {/* Bottom bar */}
      <Container width="page" className="flex flex-col items-center gap-2 py-5 text-center sm:flex-row sm:justify-between">
        <p className="text-xs text-fg-muted">
          © {new Date().getFullYear()} {siteConfig.name}. تمامی حقوق محفوظ است.
        </p>
        <p className="text-xs text-fg-muted">
          {siteConfig.contact.address}
        </p>
      </Container>
    </footer>
  );
}
