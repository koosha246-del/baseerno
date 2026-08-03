import { describe, it, expect } from "vitest";
import { navigation, headerCta } from "../navigation";

describe("navigation config", () => {
  it("has correct items for English-learning focus", () => {
    expect(navigation).toHaveLength(2);
    expect(navigation[0]).toMatchObject({ id: "home", label: "خانه" });
    expect(navigation[1]).toMatchObject({ id: "courses", label: "درس‌ها" });
  });

  it("each nav item has required fields", () => {
    for (const item of navigation) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("label");
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
    }
  });

  it("headerCta points to /courses", () => {
    expect(headerCta).toMatchObject({
      label: "شروع یادگیری",
      href: "/courses",
    });
  });
});
