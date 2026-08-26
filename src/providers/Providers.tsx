"use client";

import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { LocaleProvider } from "@/lib/i18n";

// sonner v2's Toaster exports undefined during SSR (Next 15 + React 19),
// causing "Element type is invalid" errors and a blank page. Lazy-load it
// client-side only so it never runs on the server.
const Toaster = dynamic(
  () => import("sonner").then((m) => m.Toaster),
  { ssr: false },
);

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
      <LocaleProvider>
        {children}
        <Toaster
          position="top-left"
          dir="rtl"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans text-sm",
            duration: 4000,
          }}
        />
      </LocaleProvider>
    </ThemeProvider>
  );
}
