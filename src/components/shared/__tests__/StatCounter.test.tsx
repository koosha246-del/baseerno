import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { StatCounter } from "../StatCounter";

// Mock useReducedMotion to return false by default
vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

describe("StatCounter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock IntersectionObserver
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        callback: IntersectionObserverCallback;
        root = null;
        rootMargin = "";
        thresholds = [0];
        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }
        observe(el: Element) {
          // Immediately trigger intersection
          this.callback(
            [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the final value when animate is false", () => {
    render(<StatCounter value={100} suffix="+" animate={false} />);
    expect(screen.getByText("۱۰۰+")).toBeInTheDocument();
  });

  it("renders with prefix when provided", () => {
    render(<StatCounter value={50} prefix="$" animate={false} />);
    expect(screen.getByText("$۵۰")).toBeInTheDocument();
  });

  it("renders with suffix when provided", () => {
    render(<StatCounter value={96} suffix="%" animate={false} />);
    expect(screen.getByText("۹۶٪")).toBeInTheDocument();
  });

  it("renders with decimals when specified", () => {
    render(<StatCounter value={3.14} decimals={2} animate={false} />);
    expect(screen.getByText("۳٫۱۴")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<StatCounter value={10} className="custom" />);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    // jest-axe relies on real timers internally — the shared fake-timer
    // setup in beforeEach would hang axe() otherwise.
    vi.useRealTimers();
    const { container } = render(
      <StatCounter value={12000} suffix="+" animate={false} />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("renders Persian digits", () => {
    render(<StatCounter value={123} animate={false} />);
    expect(screen.getByText("۱۲۳")).toBeInTheDocument();
  });
});
