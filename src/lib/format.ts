/**
 * Localization formatters — Persian (fa-IR).
 *
 * - Persian digits
 * - Toman currency formatting
 * - Compact counts for achievements (هزار / میلیون)
 *
 * All number-to-string conversions go through Intl where possible so
 * grouping and digit substitution stay correct for fa-IR.
 */

const faNumberFormatter = new Intl.NumberFormat("fa-IR");
const faNumberGrouped = new Intl.NumberFormat("fa-IR", {
  useGrouping: true,
});

/** Convert any number to Eastern-Arabic (Persian) digits. */
export function toPersianDigits(value: number | string): string {
  if (typeof value === "number") return faNumberFormatter.format(value);
  return value.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
}

/** Format a count with Persian digits and thousands grouping. */
export function formatCount(value: number): string {
  return faNumberGrouped.format(value);
}

/**
 * Format an integer as Toman currency, Persian digits.
 * Example: 1_250_000 → "۱,۲۵۰,۰۰۰ تومان"
 */
export function formatToman(value: number): string {
  return `${faNumberGrouped.format(value)} تومان`;
}

/**
 * Compact count for hero/achievement big numbers.
 * Returns Persian-digits + fa unit words.
 */
export function formatCompactFa(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded = Number.isInteger(millions)
      ? millions
      : Number(millions.toFixed(1));
    return `${toPersianDigits(rounded)} میلیون`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    const rounded = Number.isInteger(thousands)
      ? thousands
      : Number(thousands.toFixed(1));
    return `${toPersianDigits(rounded)} هزار`;
  }
  return toPersianDigits(value);
}

/** Persian-relative "since year" for things like "از سال ۱۳۹۸". */
export function formatYearFa(year: number): string {
  return toPersianDigits(year);
}
