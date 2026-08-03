import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Separator } from "../separator";

describe("Separator — accessibility", () => {
  it("has no accessibility violations (horizontal)", async () => {
    const { container } = render(<Separator />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("has no accessibility violations (vertical)", async () => {
    const { container } = render(
      <div style={{ height: 100 }}>
        <Separator orientation="vertical" />
      </div>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("has role=separator", () => {
    // Radix only exposes role="separator" for non-decorative separators —
    // decorative ones omit the role on purpose.
    const { container } = render(<Separator decorative={false} />);
    const sep = container.querySelector("[role='separator']");
    expect(sep).toBeInTheDocument();
  });
});
