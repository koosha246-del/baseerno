import { describe, it, expect } from "vitest";

describe("Format Utilities Extended", () => {
  it("should format Toman correctly", async () => {
    const { formatToman } = await import("@/lib/format");
    expect(formatToman(1000)).toContain("۱٬۰۰۰");
    expect(formatToman(1000)).toContain("تومان");
  });

  it("should format compact numbers in Persian", async () => {
    const { formatCompactFa } = await import("@/lib/format");
    const result = formatCompactFa(1500000);
    expect(result).toContain("۱");
    expect(result).toContain("میلیون");
  });

  it("should format year in Persian", async () => {
    const { formatYearFa } = await import("@/lib/format");
    const result = formatYearFa(2024);
    expect(typeof result).toBe("string");
  });
});
