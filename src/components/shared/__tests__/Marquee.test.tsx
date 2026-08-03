import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Marquee } from "../Marquee";

describe("Marquee", () => {
  it("renders children", () => {
    // Marquee duplicates children for the seamless loop, so each child
    // appears twice in the DOM — assert presence with getAllByText.
    render(
      <Marquee>
        <span>Item 1</span>
        <span>Item 2</span>
      </Marquee>
    );
    expect(screen.getAllByText("Item 1")).toHaveLength(2);
    expect(screen.getAllByText("Item 2")).toHaveLength(2);
  });

  it("renders children twice for seamless loop", () => {
    render(
      <Marquee>
        <span>Item</span>
      </Marquee>
    );
    const items = screen.getAllByText("Item");
    expect(items).toHaveLength(2);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Marquee className="custom-marquee">
        <span>Content</span>
      </Marquee>
    );
    expect(container.firstChild).toHaveClass("custom-marquee");
  });

  it("sets dir=ltr for correct scroll direction", () => {
    const { container } = render(
      <Marquee>
        <span>Content</span>
      </Marquee>
    );
    expect(container.firstChild).toHaveAttribute("dir", "ltr");
  });

  it("marks duplicate content as aria-hidden", () => {
    const { container } = render(
      <Marquee>
        <span>Content</span>
      </Marquee>
    );
    const divs = container.querySelectorAll(".flex.shrink-0");
    expect(divs[1]).toHaveAttribute("aria-hidden");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Marquee>
        <span>Cambridge University Press</span>
        <span>Interchange Series</span>
        <span>TESOL Certified</span>
      </Marquee>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
