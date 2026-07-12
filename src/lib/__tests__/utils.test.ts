import { describe, it, expect } from "vitest";
import { cn, humanize } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "end")).toBe("base end");
  });
});

describe("humanize", () => {
  it("converts camelCase to words", () => {
    expect(humanize("firstName")).toBe("first Name");
  });

  it("converts kebab-case to words", () => {
    expect(humanize("my-component")).toBe("my component");
  });

  it("converts snake_case to words", () => {
    expect(humanize("my_variable")).toBe("my variable");
  });
});
