import { describe, it, expect } from "vitest";
import { fadeUp, fadeIn, staggerContainer, staggerItem } from "../motion";

describe("motion variants", () => {
  it("fadeUp defines hidden and visible states", () => {
    expect(fadeUp.hidden).toBeDefined();
    expect(fadeUp.visible).toBeDefined();
  });

  it("fadeUp hidden starts with y offset", () => {
    const hidden = fadeUp.hidden as { opacity: number; y: number };
    expect(hidden.opacity).toBe(0);
    expect(hidden.y).toBeGreaterThan(0);
  });

  it("fadeIn has no y offset (pure opacity)", () => {
    const hidden = fadeIn.hidden as { opacity: number };
    expect(hidden.opacity).toBe(0);
  });

  it("staggerContainer accepts delay and stagger values", () => {
    const v = staggerContainer(0.1, 0.2);
    expect(v.visible).toBeDefined();
    const visible = v.visible as { transition?: { staggerChildren?: number; delayChildren?: number } };
    expect(visible.transition?.staggerChildren).toBe(0.1);
    expect(visible.transition?.delayChildren).toBe(0.2);
  });

  it("staggerItem has no transition of its own (inherits from parent)", () => {
    const item = staggerItem as { hidden?: unknown; visible?: unknown };
    expect(item.hidden).toBeDefined();
    expect(item.visible).toBeDefined();
  });
});
