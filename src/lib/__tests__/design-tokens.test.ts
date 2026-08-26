import { describe, it, expect } from "vitest";
import { colors } from "../design-tokens";

describe("design tokens", () => {
  it("brand gradient has all 4 stops in the expected order", () => {
    // Source of truth: design-tokens.ts (mirrored in globals.css as
    // --brand-navy etc.). Palette re-tune: navy #1E3A5F→#17324D,
    // blue #2563EB→#087F8C (teal), amber/gold warmed.
    expect(colors.brand.navy).toBe("#17324D");
    expect(colors.brand.blue).toBe("#087F8C");
    expect(colors.brand.amber).toBe("#D89B19");
    expect(colors.brand.gold).toBe("#F2C14E");
  });

  it("hex colors are 6-digit with leading hash", () => {
    const allHex = Object.values(colors.brand);
    for (const v of allHex) {
      expect(v).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
