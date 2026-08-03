import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

// Mock next-themes — the toggle reads from useTheme() and the real
// provider depends on the DOM <html> element which jsdom doesn't update
// in the way next-themes expects.
const setThemeMock = vi.fn();
let currentTheme: "light" | "dark" | "system" = "light";
let resolvedTheme: "light" | "dark" = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: currentTheme,
    resolvedTheme,
    setTheme: (next: "light" | "dark" | "system") => {
      currentTheme = next;
      setThemeMock(next);
    },
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setThemeMock.mockClear();
    currentTheme = "light";
    resolvedTheme = "light";
  });

  it("renders an accessible button", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /فعال‌سازی تم تاریک/ });
    expect(btn).toBeInTheDocument();
  });

  it("calls setTheme with the opposite theme on click", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /فعال‌سازی تم تاریک/ });
    fireEvent.click(btn);
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("shows the activate-light label when dark is active", () => {
    currentTheme = "dark";
    resolvedTheme = "dark";
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /فعال‌سازی تم روشن/ });
    expect(btn).toBeInTheDocument();
  });
});
