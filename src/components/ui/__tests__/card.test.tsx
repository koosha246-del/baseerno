import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card";

describe("Card", () => {
  it("renders children inside an elevated surface", () => {
    const { container } = render(<Card>Body</Card>);
    expect(container.firstChild).toHaveClass("rounded-2xl");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("composes header / title / description / content / footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>عنوان</CardTitle>
          <CardDescription>توضیح کوتاه</CardDescription>
        </CardHeader>
        <CardContent>محتوا</CardContent>
        <CardFooter>پاورقی</CardFooter>
      </Card>,
    );
    expect(screen.getByText("عنوان")).toBeInTheDocument();
    expect(screen.getByText("توضیح کوتاه")).toBeInTheDocument();
    expect(screen.getByText("محتوا")).toBeInTheDocument();
    expect(screen.getByText("پاورقی")).toBeInTheDocument();
  });

  it("renders CardTitle as an h3", () => {
    render(
      <Card>
        <CardTitle>عنوان</CardTitle>
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("عنوان");
  });
});
