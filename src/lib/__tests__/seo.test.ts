import { describe, it, expect } from "vitest";

describe("SEO Utilities", () => {
  it("should build base metadata", async () => {
    const { buildBaseMetadata } = await import("@/lib/seo");
    const metadata = buildBaseMetadata();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
  });

  it("should build organization JSON-LD", async () => {
    const { buildOrganizationLd } = await import("@/lib/seo");
    const ld = buildOrganizationLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@graph"]).toBeDefined();
    expect(Array.isArray(ld["@graph"])).toBe(true);
  });

  it("should build FAQ JSON-LD", async () => {
    const { buildFaqLd } = await import("@/lib/seo");
    const faqs = [
      { question: "Test?", answer: "Answer" },
    ];
    const ld = buildFaqLd(faqs);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(1);
  });

  it("should build course JSON-LD", async () => {
    const { buildCourseLd } = await import("@/lib/seo");
    const ld = buildCourseLd({
      title: "Test Course",
      description: "Description",
      price: 100000,
      rating: 4.5,
      reviews: 100,
      mentor: "Test Mentor",
      lessons: 10,
      durationHours: 5,
      level: "مقدماتی",
    });
    expect(ld["@type"]).toBe("Course");
    expect(ld.name).toBe("Test Course");
  });

  it("should build breadcrumb JSON-LD", async () => {
    const { buildBreadcrumbLd } = await import("@/lib/seo");
    const ld = buildBreadcrumbLd([
      { name: "Home", url: "https://example.com" },
      { name: "Courses", url: "https://example.com/courses" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(2);
  });
});
