import { describe, it, expect } from "vitest";
import {
  toPersianDigits,
  formatCount,
  formatToman,
  formatCompactFa,
  formatDate,
} from "../format";

describe("format", () => {
  describe("toPersianDigits", () => {
    it("converts numbers to Persian digits", () => {
      // Intl.NumberFormat("fa-IR") uses the Persian thousands separator (٬)
      // which is U+066C, not the ASCII comma
      const result = toPersianDigits(1234);
      expect(result).toContain("۱");
      expect(result).toContain("۲");
      expect(result).toContain("۳");
      expect(result).toContain("۴");
    });

    it("converts numeric string to Persian digits", () => {
      const result = toPersianDigits("1234567890");
      expect(result).toMatch(/[۰۱۲۳۴۵۶۷۸۹]/);
      expect(result).not.toContain("0");
      expect(result).not.toContain("9");
    });

    it("preserves non-digit characters in mixed strings", () => {
      const result = toPersianDigits("شماره 123");
      expect(result).toContain("شماره");
      expect(result).toContain("۱");
      expect(result).toContain("۲");
      expect(result).toContain("۳");
    });

    it("returns empty string for empty input", () => {
      expect(toPersianDigits("")).toBe("");
    });
  });

  describe("formatCount", () => {
    it("formats with Persian digits and grouping", () => {
      const result = formatCount(12500);
      expect(result).toMatch(/[۰۱۲۳۴۵۶۷۸۹]/);
    });
  });

  describe("formatToman", () => {
    it("formats as Toman with Persian digits", () => {
      const result = formatToman(1250000);
      expect(result).toContain("تومان");
      expect(result).toMatch(/[۰۱۲۳۴۵۶۷۸۹]/);
    });

    it("handles zero", () => {
      const result = formatToman(0);
      expect(result).toContain("تومان");
    });
  });

  describe("formatCompactFa", () => {
    it("formats thousands as 'هزار'", () => {
      const result = formatCompactFa(12000);
      expect(result).toContain("هزار");
      expect(result).toMatch(/[۰۱۲۳۴۵۶۷۸۹]/);
    });

    it("formats millions as 'میلیون'", () => {
      const result = formatCompactFa(2500000);
      expect(result).toContain("میلیون");
    });

    it("formats small numbers without suffix", () => {
      const result = formatCompactFa(42);
      expect(result).toMatch(/[۰۱۲۳۴۵۶۷۸۹]/);
      expect(result).not.toContain("هزار");
      expect(result).not.toContain("میلیون");
    });

    it("handles zero", () => {
      const result = formatCompactFa(0);
      expect(result).toMatch(/[۰]/);
    });
  });

  describe("formatDate", () => {
    it("formats a Date object in short style", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      const result = formatDate(date, "short");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats a Date object in long style", () => {
      const date = new Date("2024-06-20T10:30:00Z");
      const result = formatDate(date, "long");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats a Date object in datetime style", () => {
      const date = new Date("2024-09-10T14:45:00Z");
      const result = formatDate(date, "datetime");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats an ISO string", () => {
      const result = formatDate("2024-12-25T08:00:00Z");
      expect(typeof result).toBe("string");
    });

    it("formats a timestamp number", () => {
      const result = formatDate(1700000000000);
      expect(typeof result).toBe("string");
    });

    it("returns '—' for invalid date", () => {
      expect(formatDate("not-a-date", "short")).toBe("—");
      expect(formatDate(new Date("invalid"), "short")).toBe("—");
    });

    it("defaults to short style", () => {
      const date = new Date("2024-01-01");
      const result = formatDate(date);
      expect(typeof result).toBe("string");
    });
  });
});
