"use client";

import { cn } from "@/lib/utils";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useFocusVisible } from "@/hooks/useFocusVisible";
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
  const isKeyboard = useFocusVisible();

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
                  "relative inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-base ease-luxury",
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "text-fg-secondary hover:bg-surface-subtle hover:text-fg-primary",
                  isKeyboard && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                )}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute -bottom-1 right-3 h-1 w-6 -rotate-2 bg-[#e85d3f]" />
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
