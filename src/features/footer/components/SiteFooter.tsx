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
    <footer className="border-t border-app-border-subtle bg-surface-muted">
      <Container width="page" className="py-14 lg:py-16">
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
