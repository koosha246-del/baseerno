import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders text content", () => {
    render(<Badge>جدید</Badge>);
    expect(screen.getByText("جدید")).toBeInTheDocument();
  });

  it("renders as a span by default", () => {
    const { container } = render(<Badge>x</Badge>);
    expect(container.querySelector("span")).not.toBeNull();
  });

  it("applies the brand variant class", () => {
    const { container } = render(<Badge variant="brand">x</Badge>);
    expect(container.firstChild).toHaveClass("bg-brand-gradient");
  });

  it("applies the success variant class", () => {
    const { container } = render(<Badge variant="success">x</Badge>);
    expect(container.firstChild).toHaveClass("text-status-success");
  });

  it("forwards extra className", () => {
    const { container } = render(<Badge className="ml-2">x</Badge>);
    expect(container.firstChild).toHaveClass("ml-2");
  });
});
