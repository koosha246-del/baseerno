/**
 * i18n client — React context, provider, and hooks for locale management.
 *
 * Pure functions (`resolveMessage`, `t`) live in `./resolve` (safe for server).
 * This file is "use client" because it manages React state and context.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { resolveMessage } from "./resolve";
import { type Locale, type MessagePath } from "./messages";

// ─── Context ────────────────────────────────────────────────────────

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "baseer-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "fa";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "fa" || stored === "en") return stored;
  const browserLang = navigator.language?.slice(0, 2);
  return browserLang === "en" ? "en" : "fa";
}

// ─── Provider ───────────────────────────────────────────────────────

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale === "fa" ? "fa" : "en";
      document.documentElement.dir = newLocale === "fa" ? "rtl" : "ltr";
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

export function useT() {
  const { locale } = useLocale();
  return {
    t: (path: MessagePath, params?: Record<string, string | number>) =>
      resolveMessage(path, params, locale),
  };
}
