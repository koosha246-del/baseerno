"use client";

import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { Container } from "@/components/shared/Container";
import { headerData } from "../constants";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { HeaderActions } from "./HeaderActions";
import { MobileNav } from "./MobileNav";

/**
 * SiteHeader — sticky glassmorphism header.
 *
 * - Fixed at top with z-header.
 * - Glass blur + border + shadow appear only after scroll (useScrolled).
 * - Desktop nav hidden under md; mobile drawer takes over.
 */
export function SiteHeader() {
  const scrolled = useScrolled(16);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-header transition-all duration-slow ease-luxury",
        scrolled
          ? "glass border-b border-app-border-subtle shadow-sm"
          : "border-b border-transparent bg-transparent"
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

        <div className="flex items-center gap-2">
          <HeaderActions />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
