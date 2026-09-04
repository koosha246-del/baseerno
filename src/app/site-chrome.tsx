import { SiteHeader } from "@/features/header/components/SiteHeader";
import { SiteFooter } from "@/components/site/site-footer";

/**
 * SiteChrome — public header + footer wrapper.
 *
 * Secondary marketing/info pages (about, faq, contact, privacy, terms,
 * library) render a `pt-[calc(var(--header-h)+…)]` offset but previously
 * shipped no header/footer at all: users who landed from search or social
 * saw an empty band on top and had no way to navigate. Each such page opts
 * in via a one-line `layout.tsx`.
 *
 * Lives under src/app (not src/components) because it composes a feature
 * header — the boundary rules allow app → features, never components →
 * features.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
