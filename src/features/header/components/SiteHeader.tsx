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
import { AnnouncementBar } from "./AnnouncementBar";
import { SearchBar } from "./SearchBar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBadge } from "./NotificationBadge";
import { UserAvatarDropdown } from "./UserAvatarDropdown";

/**
 * SiteHeader — sticky glassmorphism header with rich features.
 *
 * - Announcement bar at the very top (dismissible).
 * - Fixed at top with z-header.
 * - Glass blur + border + shadow appear only after scroll (useScrolled).
 * - Desktop nav hidden under md; mobile drawer takes over.
 * - Includes search, language switcher, notifications, and user menu.
 */
export function SiteHeader() {
  const scrolled = useScrolled(16);

  return (
    <header
      aria-label="سربرگ سایت"
      className="fixed inset-x-0 top-0 z-header"
    >
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Main Header */}
      <div
        className={cn(
          "transition-all duration-slow ease-luxury",
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

          <div className="flex items-center gap-1">
            <SearchBar />
            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationBadge />
            <UserAvatarDropdown />
            <HeaderActions />
            <MobileNav />
          </div>
        </Container>
      </div>
    </header>
  );
}
