/**
 * i18n barrel — re-exports everything from the i18n module.
 *
 * Server-safe exports: `resolveMessage`, `t` (from ./resolve.ts)
 * Client-only exports: `LocaleProvider`, `useLocale`, `useT` (from ./index.tsx)
 */

export { resolveMessage, t } from "./resolve";
export { LocaleProvider, useLocale, useT } from "./client";
