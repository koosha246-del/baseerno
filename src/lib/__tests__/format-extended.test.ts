import { describe, it, expect } from "vitest";
import {
  toPersianDigits,
  formatToman,
  formatCompactFa,
  formatDate,
} from "../format";

describe("format (extended)", () => {
  describe("toPersianDigits", () => {
    it("converts number to Persian digits", () => {
      expect(toPersianDigits(123)).toBe("۱۲۳");
    });
    it("converts numeric string to Persian digits", () => {
      expect(toPersianDigits("4567")).toBe("۴۵۶۷");
    });
    it("preserves non-digit characters", () => {
      expect(toPersianDigits("۲۰۲۴-۰۱-۰۱")).toBe("۲۰۲۴-۰۱-۰۱");
    });
    it("handles zero", () => {
      expect(toPersianDigits(0)).toBe("۰");
    });
  });

  describe("formatToman", () => {
    it("formats with grouping and تومان suffix", () => {
      const result = formatToman(1250000);
      expect(result).toContain("تومان");
      // Should contain Persian digits with grouping
      expect(result).toContain("۱");
    });
    it("handles zero", () => {
      expect(formatToman(0)).toBe("۰ تومان");
    });
  });

  describe("formatCompactFa", () => {
    it("formats millions", () => {
      expect(formatCompactFa(1_500_000)).toContain("میلیون");
    });
    it("formats thousands", () => {
      const result = formatCompactFa(2500);
      expect(result).toContain("هزار");
      expect(result).toContain("۲");
    });
    it("returns plain digits for small numbers", () => {
      expect(formatCompactFa(42)).toBe("۴۲");
    });
  });

  describe("formatDate", () => {
    it("returns dash for invalid dates", () => {
      expect(formatDate("not-a-date")).toBe("—");
    });
    it("formats a valid date without throwing", () => {
      const result = formatDate(new Date("2024-01-15"), "short");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
