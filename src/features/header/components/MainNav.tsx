"use client";

import { cn } from "@/lib/utils";
import { useActiveSection } from "@/hooks/useActiveSection";
import type { HeaderNavItem } from "../types";

interface MainNavProps {
  items: HeaderNavItem[];
}

/**
 * MainNav — desktop navigation with active-section scroll-spy.
 * Highlights the section currently in view via IntersectionObserver.
 */
export function MainNav({ items }: MainNavProps) {
  const ids = items.map((i) => i.id);
  const active = useActiveSection(ids);

  return (
    <nav aria-label="ناوبری اصلی">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center rounded-pill px-4 py-2 text-sm font-semibold transition-colors duration-base ease-luxury",
                  isActive
                    ? "text-accent"
                    : "text-fg-secondary hover:text-fg-primary"
                )}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-gradient" />
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
