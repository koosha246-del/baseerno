/**
 * Pure i18n functions — no React, no "use client".
 * Safe to import from server components or client components.
 *
 * This file contains NO hooks, NO context — just pure message resolution.
 */

import { messages, type Locale, type MessagePath } from "./messages";

/**
 * Resolve a message path with explicit locale (for server components / SSR).
 *
 * @example
 * resolveMessage("home.welcome.badge", { name: "بصیر نو" }, "fa")
 * // → "خوش اومدی به بصیر نو"
 */
export function resolveMessage(
  path: MessagePath,
  params?: Record<string, string | number>,
  locale: Locale = "fa",
): string {
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = messages[locale];

  for (const key of keys) {
    if (value == null || typeof value !== "object") {
      console.warn(`[i18n] Invalid path: "${path}" for locale "${locale}"`);
      return path;
    }
    value = value[key as keyof typeof value];
  }

  if (typeof value !== "string") {
    console.warn(`[i18n] Path "${path}" resolved to non-string value`);
    return path;
  }

  // Simple interpolation: replace {key} with params
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, key: string) => {
      return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
  }

  return value;
}

/**
 * Standalone translate function (alias for resolveMessage).
 * Safe to use anywhere — no React dependency.
 *
 * @deprecated Prefer `resolveMessage()` in server code or `useT()` in client components.
 */
export function t(
  path: MessagePath,
  params?: Record<string, string | number>,
  locale: Locale = "fa",
): string {
  return resolveMessage(path, params, locale);
}
