"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, ArrowLeft } from "lucide-react";
import { Logo } from "./logo";
import { AuthActions } from "./AuthActions";
import { PublicSearch } from "@/components/shared/PublicSearch";
import { Button } from "@/components/ui/button";
import { navItems, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * هدر اصلی — چسبان، با منوی همبرگری در موبایل
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // بستن منو با کلید Escape
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // قفل اسکرول بدنه هنگام باز بودن منوی موبایل
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || menuOpen
          ? "bg-white/95 shadow-[0_1px_0_0_rgba(14,42,84,0.08),0_8px_24px_-16px_rgba(14,42,84,0.18)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* برند — سمت راست */}
        <Link
          href="#top"
          aria-label={`بازگشت به ابتدای صفحه — ${siteConfig.name}`}
          className="shrink-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40"
        >
          <Logo />
        </Link>

        {/* منوی اصلی — دسکتاپ */}
        <nav aria-label="منوی اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-lg px-3.5 py-2 text-[15px] font-semibold text-ink/80 transition-colors hover:bg-brand-tint hover:text-brand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* اقدام اصلی + جستجو + ورود/پنل + دکمه منو */}
        <div className="flex items-center gap-2">
          <PublicSearch />
          <AuthActions />
          <Button
            asChild
            variant="brand"
            size="lg"
            className="hidden h-11 rounded-xl px-6 text-[15px] sm:inline-flex"
          >
            <a href={siteConfig.primaryCta.href}>
              {siteConfig.primaryCta.label}
              <ArrowLeft aria-hidden="true" />
            </a>
          </Button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            className="inline-flex size-11 items-center justify-center rounded-xl text-navy transition-colors hover:bg-brand-tint lg:hidden"
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden border-t border-navy/5 bg-white/98 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out lg:hidden",
          menuOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav aria-label="منوی موبایل" className="px-4 py-4 sm:px-6">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-ink transition-colors hover:bg-brand-tint hover:text-brand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Button asChild variant="brand" size="xl" className="mt-3 w-full">
            <a href={siteConfig.primaryCta.href} onClick={() => setMenuOpen(false)}>
              {siteConfig.primaryCta.label}
              <ArrowLeft aria-hidden="true" />
            </a>
          </Button>

          {/* دسترسی به اپلیکیشن: دوره‌ها + ورود/پنل */}
          <div className="mt-3 flex gap-2 border-t border-navy/5 pt-3">
            <Link
              href="/courses"
              onClick={() => setMenuOpen(false)}
              className="flex flex-1 items-center justify-center rounded-xl border border-navy/15 px-4 py-3 text-[15px] font-semibold text-navy transition-colors hover:border-brand hover:text-brand"
            >
              همه دوره‌ها
            </Link>
            <AuthActions variant="mobile" />
          </div>
        </nav>
      </div>
    </header>
  );
}
