import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PopularCoursesClient } from "../components/PopularCoursesClient";
import type { Course, CourseCategory } from "../types";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockCourses: Course[] = [
  {
    id: "1",
    title: "انگلیسی از صفر",
    subtitle: "حروف و کلمات ساده",
    category: "grammar",
    level: "مقدماتی",
    mentor: "سارا محمدی",
    mentorInitial: "س",
    rating: 4.9,
    reviews: 100,
    durationHours: 18,
    lessons: 64,
    price: 850000,
    originalPrice: 1200000,
    bestseller: true,
    accent: "violet",
    glyph: "📘",
  },
  {
    id: "2",
    title: "شنیدن و تلفظ",
    subtitle: "گوش کردن درست",
    category: "listening",
    level: "متوسط",
    mentor: "نگار احمدی",
    mentorInitial: "ن",
    rating: 4.8,
    reviews: 50,
    durationHours: 16,
    lessons: 48,
    price: 980000,
    accent: "orchid",
    glyph: "🎧",
  },
  {
    id: "3",
    title: "گرامر آسان",
    subtitle: "قواعد مهم",
    category: "grammar",
    level: "متوسط",
    mentor: "رضا کریمی",
    mentorInitial: "ر",
    rating: 4.7,
    reviews: 75,
    durationHours: 24,
    lessons: 82,
    price: 1200000,
    originalPrice: 1500000,
    accent: "pink",
    glyph: "✏️",
  },
];

const mockCategories: CourseCategory[] = [
  { id: "all", label: "همه" },
  { id: "grammar", label: "گرامر" },
  { id: "listening", label: "شنیدن" },
];

const mockAccentClasses: Record<string, string> = {
  violet: "from-violet-500/20",
  orchid: "from-orchid-500/20",
  pink: "from-pink-500/20",
  amber: "from-amber-500/20",
  blue: "from-blue-500/20",
};

describe("PopularCoursesClient", () => {
  it("renders all courses by default", () => {
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={mockCategories}
        accentClasses={mockAccentClasses}
      />,
    );

    expect(screen.getByText("انگلیسی از صفر")).toBeDefined();
    expect(screen.getByText("شنیدن و تلفظ")).toBeDefined();
    expect(screen.getByText("گرامر آسان")).toBeDefined();
  });

  it("filters courses by category", () => {
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={mockCategories}
        accentClasses={mockAccentClasses}
      />,
    );

    // Click "شنیدن" filter
    fireEvent.click(screen.getByText("شنیدن"));

    expect(screen.queryByText("انگلیسی از صفر")).toBeNull();
    expect(screen.getByText("شنیدن و تلفظ")).toBeDefined();
    expect(screen.queryByText("گرامر آسان")).toBeNull();
  });

  it("shows empty state when no courses match filter", () => {
    render(
      <PopularCoursesClient
        courses={[]}
        categories={mockCategories}
        accentClasses={mockAccentClasses}
      />,
    );

    expect(screen.getByText("درسی در این بخش پیدا نشد")).toBeDefined();
  });

  it("has link to /courses catalog", () => {
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={mockCategories}
        accentClasses={mockAccentClasses}
      />,
    );

    const allCoursesLink = screen.getByText("همه درس‌ها");
    expect(allCoursesLink).toBeDefined();
    expect(allCoursesLink.closest("a")?.getAttribute("href")).toBe("/courses");
  });

  it("searches courses by title", () => {
    render(
      <PopularCoursesClient
        courses={mockCourses}
        categories={mockCategories}
        accentClasses={mockAccentClasses}
      />,
    );

    const searchInput = screen.getByPlaceholderText("جستجوی درس...");
    fireEvent.change(searchInput, { target: { value: "گرامر" } });

    expect(screen.queryByText("انگلیسی از صفر")).toBeNull();
    expect(screen.queryByText("شنیدن و تلفظ")).toBeNull();
    expect(screen.getByText("گرامر آسان")).toBeDefined();
  });
});
