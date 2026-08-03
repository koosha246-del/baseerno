import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "../Container";

describe("Container", () => {
  it("renders children", () => {
    render(<Container>محتوای تست</Container>);
    expect(screen.getByText("محتوای تست")).toBeInTheDocument();
  });

  it("renders as div by default", () => {
    render(<Container>تست</Container>);
    const container = screen.getByText("تست");
    expect(container.tagName).toBe("DIV");
  });

  it("renders as a different element when 'as' prop is set", () => {
    render(<Container as="section">تست</Container>);
    const container = screen.getByText("تست");
    expect(container.tagName).toBe("SECTION");
  });

  it("applies page width class by default", () => {
    render(<Container>تست</Container>);
    const container = screen.getByText("تست");
    expect(container.className).toContain("max-w-page");
  });

  it("applies narrow width class", () => {
    render(<Container width="narrow">تست</Container>);
    const container = screen.getByText("تست");
    expect(container.className).toContain("max-w-narrow");
  });

  it("applies wide width class", () => {
    render(<Container width="wide">تست</Container>);
    const container = screen.getByText("تست");
    expect(container.className).toContain("max-w-wide");
  });

  it("merges custom className", () => {
    render(<Container className="my-extra-class">تست</Container>);
    const container = screen.getByText("تست");
    expect(container.className).toContain("my-extra-class");
    expect(container.className).toContain("max-w-page");
  });

  it("includes responsive padding classes", () => {
    render(<Container>تست</Container>);
    const container = screen.getByText("تست");
    expect(container.className).toContain("px-5");
    expect(container.className).toContain("w-full");
    expect(container.className).toContain("mx-auto");
  });

  it("spreads additional props", () => {
    render(<Container data-testid="container-test">تست</Container>);
    expect(screen.getByTestId("container-test")).toBeInTheDocument();
  });
});
