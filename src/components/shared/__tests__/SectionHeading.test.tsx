import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { SectionHeading } from "../SectionHeading";

describe("SectionHeading", () => {
  it("renders the title", () => {
    render(<SectionHeading title="Test Title" />);
    expect(screen.getByRole("heading", { name: "Test Title" })).toBeInTheDocument();
  });

  it("renders eyebrow when provided", () => {
    render(<SectionHeading title="Title" eyebrow="Eyebrow" />);
    expect(screen.getByText("Eyebrow")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<SectionHeading title="Title" description="Description text" />);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("does not render eyebrow when not provided", () => {
    render(<SectionHeading title="Title" />);
    expect(screen.queryByText("Eyebrow")).not.toBeInTheDocument();
  });

  it("applies center alignment by default", () => {
    const { container } = render(<SectionHeading title="Title" />);
    const wrapper = container.firstChild?.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("items-center", "text-center");
  });

  it("applies start alignment when specified", () => {
    const { container } = render(<SectionHeading title="Title" align="start" />);
    const wrapper = container.firstChild?.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("items-start", "text-right");
  });

  it("applies custom className", () => {
    const { container } = render(<SectionHeading title="Title" className="custom" />);
    const wrapper = container.firstChild?.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom");
  });

  it("sets id when provided", () => {
    render(<SectionHeading title="Title" id="section-id" />);
    expect(screen.getByRole("heading", { name: "Title" })).toHaveAttribute("id", "section-id");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SectionHeading
        eyebrow="About Us"
        title="Our Mission"
        description="We teach English with proven methods."
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("has no accessibility violations with start alignment", async () => {
    const { container } = render(
      <SectionHeading
        eyebrow="About Us"
        title="Our Mission"
        description="We teach English with proven methods."
        align="start"
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
