import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";
import Link from "next/link";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>ورود</Button>);
    expect(screen.getByRole("button", { name: "ورود" })).toBeInTheDocument();
  });

  it("renders with brand variant classes", () => {
    render(<Button variant="brand">برند</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-accent");
    expect(btn.className).toContain("text-white");
  });

  it("renders with outline variant classes", () => {
    render(<Button variant="outline">حاشیه</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
    expect(btn.className).toContain("border-app-border");
  });

  it("renders with ghost variant classes", () => {
    render(<Button variant="ghost">شبح</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-fg-primary");
    expect(btn.className).toContain("hover:bg-surface-subtle");
  });

  it("renders with sm size classes", () => {
    render(<Button size="sm">کوچک</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-9");
    expect(btn.className).toContain("px-4");
    expect(btn.className).toContain("text-sm");
  });

  it("renders with lg size classes", () => {
    render(<Button size="lg">بزرگ</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-14");
    expect(btn.className).toContain("px-8");
  });

  it("renders with icon size classes", () => {
    render(<Button size="icon">آیکون</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("size-11");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>غیرفعال</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>کلیک</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("renders as a child component with asChild", () => {
    render(
      <Button asChild>
        <Link href="/test">لینک</Link>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "لینک" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">استایل سفارشی</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-class");
  });

  it("renders with solid variant by default", () => {
    render(<Button>پیش‌فرض</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-accent");
  });
});
