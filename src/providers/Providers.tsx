"use client";

import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";

/**
 * Composes all client-side context providers.
 * Mounted once inside the root layout so providers stay outside the
 * RSC tree and the rest of the app can be server components.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="baseerno-theme"
    >
      {children}
    </ThemeProvider>
  );
}
