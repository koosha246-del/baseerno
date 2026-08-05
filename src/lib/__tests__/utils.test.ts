import { describe, it, expect } from "vitest";
import { cn, humanize, groupBy } from "../utils";

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

  it("collapses repeated whitespace", () => {
    expect(humanize("  a--b  ")).toBe("a b");
  });
});

describe("groupBy", () => {
  it("groups items into a Map by the key selector", () => {
    const items = [
      { role: "ADMIN", name: "a" },
      { role: "STUDENT", name: "b" },
      { role: "ADMIN", name: "c" },
    ];
    const map = groupBy(items, (i) => i.role);
    expect(map.get("ADMIN")?.map((i) => i.name)).toEqual(["a", "c"]);
    expect(map.get("STUDENT")?.map((i) => i.name)).toEqual(["b"]);
  });

  it("returns an empty Map for an empty array", () => {
    expect(groupBy([], (i: number) => i).size).toBe(0);
  });
});
