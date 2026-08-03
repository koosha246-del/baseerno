import { describe, it, expect } from "vitest";
import { libraryBooks, findBook, formatToman } from "../library";

describe("libraryBooks", () => {
  it("contains the 5 expected books", () => {
    expect(libraryBooks).toHaveLength(5);
  });

  it("every book has the required fields", () => {
    for (const b of libraryBooks) {
      expect(b.id).toBeTruthy();
      expect(b.title).toBeTruthy();
      expect(b.author).toBeTruthy();
      expect(b.price).toBeGreaterThan(0);
      // cover is now a Cloudinary public ID (no leading slash)
      expect(b.cover).not.toMatch(/^\//);
    }
  });

  it("ids are unique", () => {
    const ids = new Set(libraryBooks.map((b) => b.id));
    expect(ids.size).toBe(libraryBooks.length);
  });
});

describe("findBook", () => {
  it("finds a book by id", () => {
    const b = findBook("interchange-1");
    expect(b).toBeDefined();
    expect(b?.title).toContain("Interchange 1");
  });

  it("returns undefined for unknown id", () => {
    expect(findBook("does-not-exist")).toBeUndefined();
  });
});

describe("formatToman", () => {
  it("uses Persian digits and 'تومان' suffix", () => {
    const s = formatToman(1234567);
    expect(s).toContain("تومان");
    expect(s).toMatch(/[۰-۹]/);
  });

  it("includes grouping separators", () => {
    const s = formatToman(1_000_000);
    // fa-IR locale uses U+066C as thousands separator
    expect(s).toMatch(/[۰-۹\u066C]/);
  });
});
