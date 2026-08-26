import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository module
vi.mock("@/lib/db/repository", () => ({
  repository: {
    findCourseById: vi.fn(),
    findSafeUserById: vi.fn(),
    countEnrollments: vi.fn(),
    listLessons: vi.fn(),
  },
}));

// Mock the static constants
vi.mock("@/features/course-detail/constants", () => ({
  courseDetails: {
    "grammar-a1": {
      title: "گرامر پایه A1",
      subtitle: "دوره جامع گرامر انگلیسی از سطح مبتدی",
      longDescription: "این دوره برای کسانی طراحی شده که می‌خواهند گرامر پایه را یاد بگیرند.",
      level: "مقدماتی",
      category: "grammar",
      mentor: "سارا محمدی",
      mentorBio: "۱۲ سال تجربه تدریس",
      rating: 4.5,
      reviews: 120,
      students: 1500,
      durationHours: 36,
      lessons: 24,
      language: "فارسی + انگلیسی",
      lastUpdated: "دی ۱۴۰۴",
      price: 500_000,
      originalPrice: 700_000,
      bestseller: true,
      accent: "violet",
      glyph: "📘",
      outcomes: [{ id: "o1", text: "تشخیص افعال و زمان‌ها" }],
      requirements: [{ id: "r1", text: "آشنایی با حروف انگلیسی" }],
      curriculum: [{ id: "l1", title: "فعل to be", durationMinutes: 15, free: true }],
      mentorInitial: "س",
    },
    "static-only": {
      title: "دوره استاتیک",
      subtitle: "بدون دیتابیس",
      longDescription: "دوره‌ای که فقط در استاتیک وجود دارد.",
      level: "پیشرفته",
      category: "ielts",
      mentor: "رضا کریمی",
      mentorBio: "مدرس آیلتس",
      rating: 4.0,
      reviews: 50,
      students: 800,
      durationHours: 48,
      lessons: 30,
      language: "فارسی",
      lastUpdated: "آذر ۱۴۰۴",
      price: 800_000,
      bestseller: false,
      accent: "blue",
      glyph: "📖",
      outcomes: [{ id: "o1", text: "آمادگی آیلتس" }],
      requirements: [{ id: "r1", text: "سطح B1" }],
      curriculum: [{ id: "l1", title: "مقدمه آیلتس", durationMinutes: 20, free: true }],
      mentorInitial: "ر",
    },
  },
}));

import { mapDbCourseDetail } from "@/features/course-detail/courseDetailMapper";
import { repository } from "@/lib/db/repository";
import type { Mock } from "vitest";

describe("mapDbCourseDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when course not found in DB or static", async () => {
    (repository.findCourseById as Mock).mockRejectedValue(new Error("DB down"));
    const result = await mapDbCourseDetail("nonexistent");
    expect(result).toBeNull();
  });

  it("falls back to static data when DB is unreachable", async () => {
    (repository.findCourseById as Mock).mockRejectedValue(new Error("DB down"));
    const result = await mapDbCourseDetail("grammar-a1");
    expect(result).not.toBeNull();
    expect(result?.title).toBe("گرامر پایه A1");
    expect(result?.mentor).toBe("سارا محمدی");
  });

  it("returns data from static when DB returns null", async () => {
    (repository.findCourseById as Mock).mockResolvedValue(null);
    const result = await mapDbCourseDetail("grammar-a1");
    expect(result).not.toBeNull();
    expect(result?.title).toBe("گرامر پایه A1");
  });

  it("merges DB course with static enrichment", async () => {
    (repository.findCourseById as Mock).mockResolvedValue({
      id: "grammar-a1",
      title: "گرامر پیشرفته B1",
      subtitle: "نسخه DB",
      description: "شرح از DB",
      level: "B1",
      category: "grammar",
      accent: "violet",
      glyph: "📘",
      mentorId: "mentor-1",
      price: 600_000,
      originalPrice: 800_000,
      rating: 4.0,
      durationHours: 40,
      lessons: 24,
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (repository.findSafeUserById as Mock).mockResolvedValue({
      id: "mentor-1",
      name: "رضا کریمی",
      bio: "مدرس ارشد",
      email: "r@test.com",
      role: "TEACHER",
      image: null,
    });
    (repository.countEnrollments as Mock).mockResolvedValue(42);
    (repository.listLessons as Mock).mockResolvedValue([
      { id: "l1", title: "فعل to be", durationMinutes: 15, isFree: true, courseId: "c1", description: "", order: 1, slug: "to-be", published: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await mapDbCourseDetail("grammar-a1");

    // DB fields take precedence
    expect(result?.title).toBe("گرامر پیشرفته B1");
    expect(result?.price).toBe(600_000);
    expect(result?.mentor).toBe("رضا کریمی");
    // DB enrollment count wins over static
    expect(result?.students).toBe(42);
    // Static fields complement
    expect(result?.outcomes).toHaveLength(1);
    expect(result?.longDescription).toBe("این دوره برای کسانی طراحی شده که می‌خواهند گرامر پایه را یاد بگیرند.");
  });

  it("counts enrolled students from DB", async () => {
    (repository.findCourseById as Mock).mockResolvedValue({
      id: "grammar-a1", title: "Test", subtitle: "", description: "", level: "A1",
      category: "grammar", accent: "blue", glyph: "📘", mentorId: "m1",
      price: null, originalPrice: null, rating: 0, durationHours: 0,
      lessons: 0, published: true, createdAt: new Date(), updatedAt: new Date(),
    });
    (repository.findSafeUserById as Mock).mockResolvedValue(null);
    (repository.countEnrollments as Mock).mockResolvedValue(42);
    (repository.listLessons as Mock).mockResolvedValue([]);

    const result = await mapDbCourseDetail("grammar-a1");
    expect(result?.students).toBe(42);
  });

  it("returns null when neither DB nor static has the course", async () => {
    (repository.findCourseById as Mock).mockResolvedValue(null);
    const result = await mapDbCourseDetail("unknown-course");
    expect(result).toBeNull();
  });
});
