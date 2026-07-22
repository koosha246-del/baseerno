import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GradientText } from "../GradientText";

describe("GradientText", () => {
  it("renders its children", () => {
    render(<GradientText>متن</GradientText>);
    expect(screen.getByText("متن")).toBeInTheDocument();
  });

  it("applies background-clip and transparent text classes", () => {
    render(<GradientText>x</GradientText>);
    const el = screen.getByText("x");
    expect(el).toHaveClass("bg-clip-text");
    expect(el).toHaveClass("text-transparent");
  });

  it("sets inline background-image style", () => {
    render(<GradientText>x</GradientText>);
    const el = screen.getByText("x") as HTMLElement;
    expect(el.style.backgroundImage).toContain("gradient");
  });

  it("renders a custom element via `as`", () => {
    render(<GradientText as="strong">x</GradientText>);
    expect(screen.getByText("x").tagName).toBe("STRONG");
  });
});
