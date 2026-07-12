"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy: returns the id of the section currently in view.
 * Uses IntersectionObserver against the provided section ids; the entry
 * closest to the top of the viewport (within the header offset) wins.
 *
 * Used by the desktop nav to highlight the active section.
 */
export function useActiveSection(
  ids: readonly string[],
  options?: { rootMargin?: string }
): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the intersecting entry nearest the top.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: options?.rootMargin ?? "-45% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, options?.rootMargin]);

  return active;
}
