import { describe, it, expect } from "vitest";
import { aria } from "../aria";

describe("aria constants", () => {
  it("defines a non-empty skip-link label for main content", () => {
    expect(aria.mainContent).toBeTypeOf("string");
    expect(aria.mainContent.length).toBeGreaterThan(0);
  });

  it("defines non-empty labels used across navigation and forms", () => {
    const expectedKeys = [
      "mainContent",
      "openNav",
      "closeNav",
      "mobileNav",
      "desktopNav",
      "courseRegister",
      "faqExpand",
      "submitConsultation",
      "newsletterSubscribe",
    ] as const;

    for (const key of expectedKeys) {
      expect(aria[key]).toBeTypeOf("string");
      expect(aria[key].length).toBeGreaterThan(0);
    }
  });
});
