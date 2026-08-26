import { describe, it, expect } from "vitest";
import { libraryBooks, findBook, formatToman } from "../library";

describe("libraryBooks", () => {
  it("contains 5 books", () => {
    expect(libraryBooks).toHaveLength(5);
  });

  it("every book has required fields", () => {
    for (const book of libraryBooks) {
      expect(book.id).toBeTruthy();
      expect(book.title).toBeTruthy();
      expect(book.level).toBeTruthy();
      expect(book.description).toBeTruthy();
      expect(typeof book.price).toBe("number");
      expect(book.price).toBeGreaterThan(0);
    }
  });

  it("covers point at real local scans", () => {
    for (const book of libraryBooks) {
      expect(book.cover).toMatch(/^\/images\/book-[a-z0-9-]+\.webp$/);
      expect(book.file).toMatch(/^\//);
    }
  });

  it("all book ids are unique", () => {
    const ids = libraryBooks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("page counts are optional but positive when present", () => {
    for (const book of libraryBooks) {
      if (book.pages !== undefined) {
        expect(book.pages).toBeGreaterThan(0);
      }
    }
  });
});

describe("findBook", () => {
  it("returns the correct book by id", () => {
    const book = findBook("ace-it-1");
    expect(book).toBeDefined();
    expect(book?.title).toBe("ACE it! 1");
  });

  it("returns undefined for unknown id", () => {
    expect(findBook("nonexistent")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(findBook("")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    expect(findBook("ACE-IT-1")).toBeUndefined();
  });
});

describe("formatToman", () => {
  it("formats numbers with Persian digits and 'تومان' suffix", () => {
    const result = formatToman(250_000);
    expect(result).toContain("تومان");
    // Should contain Persian digits
    expect(result).toMatch(/[۰-۹]/);
  });

  it("formats zero", () => {
    const result = formatToman(0);
    expect(result).toContain("تومان");
  });

  it("formats large numbers", () => {
    const result = formatToman(1_000_000);
    expect(result).toContain("تومان");
    expect(result.length).toBeGreaterThan(5);
  });
});
