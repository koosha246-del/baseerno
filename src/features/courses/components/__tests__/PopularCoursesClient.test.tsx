import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PopularCoursesClient } from "../PopularCoursesClient";
import { courseCategories, accentClasses } from "../../constants";
import type { Course } from "../../types";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    article: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, exit: _e, ...rest } = props;
      return <article {...rest}>{children as React.ReactNode}</article>;
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockCourses: Course[] = [
  {
    id: "grammar-a1",
    title: "گرامر پایه A1",
    subtitle: "یادگیری گرامر مقدماتی",
    category: "grammar",
    level: "مقدماتی",
    mentor: "رضا کریمی",
    mentorInitial: "ر",
    rating: 4.8,
    reviews: 1567,
    durationHours: 24,
    lessons: 82,
    price: 1200000,
    accent: "violet",
    glyph: "✏️",
  },
  {
    id: "vocab-1000",
    title: "واژگان ۱۰۰۰",
    subtitle: "لغات پرکاربرد",
    category: "vocabulary",
    level: "مقدماتی",
    mentor: "نگار احمدی",
    mentorInitial: "ن",
    rating: 4.9,
    reviews: 932,
    durationHours: 16,
    lessons: 48,
    price: 980000,
    accent: "pink",
    glyph: "📚",
  },
  {
    id: "ielts-prep",
    title: "آمادگی آیلتس",
    subtitle: "تکنیک‌های آزمون",
    category: "ielts",
    level: "پیشرفته",
    mentor: "سارا محمدی",
    mentorInitial: "س",
    rating: 5.0,
    reviews: 645,
    durationHours: 28,
    lessons: 96,
    price: 1650000,
    accent: "amber",
    glyph: "🎯",
  },
];

describe("PopularCoursesClient", () => {
  it("renders all courses initially", () => {
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    expect(screen.getByText("گرامر پایه A1")).toBeInTheDocument();
    expect(screen.getByText("واژگان ۱۰۰۰")).toBeInTheDocument();
    expect(screen.getByText("آمادگی آیلتس")).toBeInTheDocument();
  });

  it("filters courses by category when a tab is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    // Click on "گرامر" tab
    await user.click(screen.getByText("گرامر"));
    expect(screen.getByText("گرامر پایه A1")).toBeInTheDocument();
    expect(screen.queryByText("واژگان ۱۰۰۰")).not.toBeInTheDocument();
    expect(screen.queryByText("آمادگی آیلتس")).not.toBeInTheDocument();
  });

  it("filters courses by vocabulary category", async () => {
    const user = userEvent.setup();
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    await user.click(screen.getByText("واژگان"));
    expect(screen.queryByText("گرامر پایه A1")).not.toBeInTheDocument();
    expect(screen.getByText("واژگان ۱۰۰۰")).toBeInTheDocument();
  });

  it("searches courses by title", async () => {
    const user = userEvent.setup();
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    const searchInput = screen.getByPlaceholderText("جستجوی درس...");
    await user.type(searchInput, "آیلتس");
    expect(screen.queryByText("گرامر پایه A1")).not.toBeInTheDocument();
    expect(screen.getByText("آمادگی آیلتس")).toBeInTheDocument();
  });

  it("searches courses by mentor name", async () => {
    const user = userEvent.setup();
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    const searchInput = screen.getByPlaceholderText("جستجوی درس...");
    await user.type(searchInput, "نگار");
    expect(screen.getByText("واژگان ۱۰۰۰")).toBeInTheDocument();
    expect(screen.queryByText("آمادگی آیلتس")).not.toBeInTheDocument();
  });

  it("shows empty state when no course matches", async () => {
    const user = userEvent.setup();
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    const searchInput = screen.getByPlaceholderText("جستجوی درس...");
    await user.type(searchInput, "چیزی که وجود ندارد");
    expect(screen.getByText("درسی در این بخش پیدا نشد")).toBeInTheDocument();
  });

  it('renders the "همه درس‌ها" link', () => {
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    const allLink = screen.getByText("همه درس‌ها");
    expect(allLink).toBeInTheDocument();
    expect(allLink.closest("a")).toHaveAttribute("href", "/courses");
  });

  it("shows all courses again after filter + back to all", async () => {
    const user = userEvent.setup();
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={courseCategories}
        accentClasses={accentClasses}
      />,
    );
    // Filter by grammar
    await user.click(screen.getByText("گرامر"));
    expect(screen.queryByText("آمادگی آیلتس")).not.toBeInTheDocument();
    // Go back to all
    await user.click(screen.getByText("همه دوره‌ها"));
    expect(screen.getByText("آمادگی آیلتس")).toBeInTheDocument();
  });
});
