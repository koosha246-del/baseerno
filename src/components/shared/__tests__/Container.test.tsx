import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "../Container";

describe("Container", () => {
  it("renders a div by default with the page max-width", () => {
    const { container } = render(<Container>child</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("max-w-page");
  });

  it("applies narrow width when specified", () => {
    const { container } = render(<Container width="narrow">x</Container>);
    expect(container.firstChild).toHaveClass("max-w-narrow");
  });

  it("applies wide width when specified", () => {
    const { container } = render(<Container width="wide">x</Container>);
    expect(container.firstChild).toHaveClass("max-w-wide");
  });

  it("renders a custom element when `as` is set", () => {
    const { container } = render(<Container as="section">x</Container>);
    expect(container.firstChild?.nodeName).toBe("SECTION");
  });

  it("merges custom className", () => {
    const { container } = render(<Container className="my-section">x</Container>);
    expect(container.firstChild).toHaveClass("my-section");
  });
});
