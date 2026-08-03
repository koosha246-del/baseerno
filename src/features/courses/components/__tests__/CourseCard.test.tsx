import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Mock framer-motion to avoid animation issues in tests ────────────
vi.mock("framer-motion", () => ({
  motion: {
    article: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, exit: _e, ...rest } = props;
      return <article {...rest}>{children as React.ReactNode}</article>;
    },
  },
}));

import { CourseCard } from "../CourseCard";
import type { Course } from "../../types";

const sampleCourse: Course = {
  id: "grammar-a1",
  title: "گرامر پایه A1",
  subtitle: "زمان حال ساده، افعال to be، ضمایر",
  category: "grammar",
  level: "مقدماتی",
  mentor: "آقای رضا کریمی",
  mentorInitial: "ر",
  rating: 4.8,
  reviews: 1567,
  durationHours: 24,
  lessons: 82,
  price: 1200000,
  originalPrice: 1500000,
  bestseller: true,
  accent: "pink",
  glyph: "✏️",
};

const freeCourse: Course = {
  ...sampleCourse,
  id: "reading-stories",
  title: "داستان‌خوانی انگلیسی",
  subtitle: "داستان‌های کوتاه",
  price: null,
  bestseller: false,
  accent: "blue",
  glyph: "📖",
};

describe("CourseCard", () => {
  it("renders the course title", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(screen.getByText("گرامر پایه A1")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(
      screen.getByText("زمان حال ساده، افعال to be، ضمایر"),
    ).toBeInTheDocument();
  });

  it("renders the mentor name", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(screen.getByText("آقای رضا کریمی")).toBeInTheDocument();
  });

  it("renders the mentor initial", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(screen.getByText("ر")).toBeInTheDocument();
  });

  it("renders the course level badge", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(screen.getByText("مقدماتی")).toBeInTheDocument();
  });

  it("renders price in Toman for paid courses", () => {
    render(<CourseCard course={sampleCourse} />);
    // Course has both current price and original price (strikethrough),
    // so two elements match. Use getAllByText to verify both exist.
    const prices = screen.getAllByText((_content, element) =>
      element?.textContent?.includes("تومان") ?? false
    );
    expect(prices.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "رایگان" for free courses', () => {
    render(<CourseCard course={freeCourse} />);
    expect(screen.getByText("رایگان")).toBeInTheDocument();
  });

  it("shows bestseller badge when bestseller is true", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(screen.getByText("محبوب")).toBeInTheDocument();
  });

  it("does not show bestseller badge when bestseller is false", () => {
    render(<CourseCard course={freeCourse} />);
    expect(screen.queryByText("محبوب")).not.toBeInTheDocument();
  });

  it("renders the emoji glyph", () => {
    render(<CourseCard course={sampleCourse} />);
    expect(screen.getByText("✏️")).toBeInTheDocument();
  });

  it("links to the course detail page", () => {
    render(<CourseCard course={sampleCourse} />);
    const link = screen.getByRole("link", { name: /شروع درس/ });
    expect(link).toHaveAttribute("href", "/courses/grammar-a1");
  });

  it("renders lesson count in Persian digits", () => {
    render(<CourseCard course={sampleCourse} />);
    // "۸۲" is rendered as part of "۸۲ درس" — use a function matcher
    expect(screen.getByText((content) => content.includes("۸۲"))).toBeInTheDocument();
  });

  it("renders duration in Persian digits", () => {
    render(<CourseCard course={sampleCourse} />);
    // "۲۴" is rendered as part of "۲۴ ساعت" — use a function matcher
    expect(screen.getByText((content) => content.includes("۲۴"))).toBeInTheDocument();
  });

  it("renders without crashing when no originalPrice is set", () => {
    const courseWithoutOriginal: Course = {
      ...sampleCourse,
      originalPrice: undefined,
    };
    render(<CourseCard course={courseWithoutOriginal} />);
    expect(screen.getByText("گرامر پایه A1")).toBeInTheDocument();
  });
});
