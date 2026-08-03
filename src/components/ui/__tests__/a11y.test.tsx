import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "../button";
import { Badge } from "../badge";
import { Card } from "../card";
import { Container } from "@/components/shared/Container";
import { GradientText } from "@/components/shared/GradientText";

/**
 * axe-core accessibility tests for the shared component library.
 *
 * These run a static accessibility audit on the rendered output of every
 * base component — much faster than a full Playwright run, and catches
 * the common regressions (missing labels, role mismatches, color-only
 * state) before they ship.
 *
 * WCAG rules enforced: 2.1 Level A + AA (jest-axe defaults).
 */
expect.extend(toHaveNoViolations);

describe("component a11y (axe-core)", () => {
  it("Button has no violations", async () => {
    const { container } = render(
      <div>
        <Button>Default</Button>
        <Button variant="brand" size="lg">Brand CTA</Button>
        <Button variant="outline">Outline</Button>
        <Button disabled>Disabled</Button>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Button as link renders with accessible role", async () => {
    const { container } = render(
      <Button asChild>
        <a href="/test">Link styled as button</a>
      </Button>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Badge has no violations", async () => {
    const { container } = render(
      <div>
        <Badge>Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="muted">Muted</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Card has no violations", async () => {
    const { container } = render(
      <Card>
        <h2>Card title</h2>
        <p>Card content goes here.</p>
      </Card>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Container + GradientText have no violations", async () => {
    const { container } = render(
      <Container>
        <h1>
          <GradientText>Heading</GradientText>
        </h1>
        <p>Body copy in a container.</p>
      </Container>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("icon-only button must have an accessible name", async () => {
    // Icons without text labels are a common a11y failure.
    // The component handles this via the `aria-label` prop on the
    // underlying <button> — verify axe agrees when both are present.
    const { container } = render(
      <Button size="icon" aria-label="بستن">
        ×
      </Button>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
