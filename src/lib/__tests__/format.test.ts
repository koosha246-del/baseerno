import { describe, it, expect } from "vitest";
import {
  toPersianDigits,
  formatCount,
  formatToman,
  formatCompactFa,
  formatYearFa,
} from "../format";

describe("toPersianDigits", () => {
  it("converts number to Persian digits", () => {
    expect(toPersianDigits(0)).toBe("۰");
    expect(toPersianDigits(123)).toBe("۱۲۳");
    expect(toPersianDigits(9876)).toContain("۹");
  });

  it("converts string digits to Persian", () => {
    expect(toPersianDigits("12345")).toBe("۱۲۳۴۵");
  });
});

describe("formatCount", () => {
  it("formats with grouping", () => {
    const result = formatCount(12000);
    expect(result).toContain("۱۲");
    expect(result).toContain("۰۰۰");
  });
});

describe("formatToman", () => {
  it("formats currency with تومان suffix", () => {
    const result = formatToman(1250000);
    expect(result).toContain("تومان");
  });
});

describe("formatCompactFa", () => {
  it("formats thousands as هزار", () => {
    expect(formatCompactFa(12000)).toContain("هزار");
  });

  it("formats millions as میلیون", () => {
    expect(formatCompactFa(1000000)).toContain("میلیون");
  });

  it("returns small numbers as-is in Persian", () => {
    expect(formatCompactFa(500)).toContain("۵۰۰");
  });
});

describe("formatYearFa", () => {
  it("converts year to Persian digits", () => {
    const result = formatYearFa(1398);
    expect(result).toContain("۱");
    expect(result).toContain("۳");
    expect(result).toContain("۹");
    expect(result).toContain("۸");
  });
});
