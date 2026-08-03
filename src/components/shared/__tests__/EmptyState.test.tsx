import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders the action node when provided", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={
          <button type="button" onClick={onAction}>
            Add Item
          </button>
        }
      />,
    );
    const button = screen.getByRole("button", { name: "Add Item" });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("does not render an action when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <EmptyState
        title="No results"
        description="Try adjusting your search filters."
        action={
          <button type="button" onClick={() => {}}>
            Clear filters
          </button>
        }
      />,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
