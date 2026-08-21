"use client";

import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { Container } from "@/components/shared/Container";
import { headerData } from "../constants";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { HeaderActions } from "./HeaderActions";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

/**
 * SiteHeader — sticky editorial navigation bar.
 *
 * - Fixed at top with z-header.
 * - An opaque paper surface and graphic rule appear after scroll.
 * - Desktop nav hidden under md; mobile drawer takes over.
 */
export function SiteHeader() {
  const scrolled = useScrolled(16);

  return (
    <header
      aria-label="سربرگ سایت"
      className={cn(
        "fixed inset-x-0 top-0 z-header transition-all duration-slow ease-luxury",
        scrolled
          ? "border-b-2 border-accent bg-surface shadow-[0_4px_0_rgba(23,50,77,0.10)]"
          : "border-b border-app-border-subtle bg-background/95"
      )}
      style={{ height: "var(--header-h)" }}
    >
      <Container
        width="page"
        className="flex h-full items-center justify-between gap-4"
      >
        <Logo />

        <div className="hidden md:block">
          <MainNav items={headerData.nav} />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <HeaderActions />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
