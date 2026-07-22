import { describe, it, expect } from "vitest";
import { colors } from "../design-tokens";

describe("design tokens", () => {
  it("brand gradient has all 4 stops in the expected order", () => {
    expect(colors.brand.navy).toBe("#1E3A5F");
    expect(colors.brand.blue).toBe("#2563EB");
    expect(colors.brand.amber).toBe("#D4A017");
    expect(colors.brand.gold).toBe("#F5C518");
  });

  it("hex colors are 6-digit with leading hash", () => {
    const allHex = Object.values(colors.brand);
    for (const v of allHex) {
      expect(v).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
