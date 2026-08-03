import { describe, it, expect } from "vitest";
import {
  buildBaseMetadata,
  buildOrganizationLd,
  buildFaqLd,
  buildCourseLd,
  buildBreadcrumbLd,
  ldJson,
} from "../seo";

describe("buildCourseLd", () => {
  const course = {
    title: "گرامر پایه A1",
    description: "دوره جامع گرامر انگلیسی از سطح مبتدی",
    price: 500_000,
    rating: 4.5,
    reviews: 120,
    mentor: "سارا محمدی",
    lessons: 24,
    durationHours: 36,
    level: "مقدماتی",
  };

  it("returns a valid Course schema.org object", () => {
    const ld = buildCourseLd(course);
    expect(ld["@type"]).toBe("Course");
    expect(ld.name).toBe("گرامر پایه A1");
    expect(ld.provider["@type"]).toBe("EducationalOrganization");
  });

  it("includes aggregateRating with correct values", () => {
    const ld = buildCourseLd(course);
    expect(ld.aggregateRating.ratingValue).toBe(4.5);
    expect(ld.aggregateRating.reviewCount).toBe(120);
    expect(ld.aggregateRating.bestRating).toBe(5);
  });

  it("includes offer with correct price when price is provided", () => {
    const ld = buildCourseLd(course);
    expect(ld.offers).toBeDefined();
    expect(ld.offers!.price).toBe(500_000);
    expect(ld.offers!.priceCurrency).toBe("IRR");
  });

  it("omits offers when price is null", () => {
    const ld = buildCourseLd({ ...course, price: null });
    expect(ld.offers).toBeUndefined();
  });

  it("includes educational level and lesson count", () => {
    const ld = buildCourseLd(course);
    expect(ld.educationalLevel).toBe("مقدماتی");
    expect(ld.numberOfLessons).toBe(24);
  });
});

describe("buildBreadcrumbLd", () => {
  it("returns a valid BreadcrumbList", () => {
    const items = [
      { name: "خانه", url: "https://baseerno.ir" },
      { name: "دوره‌ها", url: "https://baseerno.ir/courses" },
      { name: "گرامر پایه", url: "https://baseerno.ir/courses/grammar-a1" },
    ];
    const ld = buildBreadcrumbLd(items);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(3);
  });

  it("positions start at 1 and increment", () => {
    const items = [
      { name: "خانه", url: "/" },
      { name: "دوره‌ها", url: "/courses" },
    ];
    const ld = buildBreadcrumbLd(items);
    expect(ld.itemListElement[0]!.position).toBe(1);
    expect(ld.itemListElement[1]!.position).toBe(2);
  });

  it("handles single item", () => {
    const ld = buildBreadcrumbLd([{ name: "خانه", url: "/" }]);
    expect(ld.itemListElement).toHaveLength(1);
    expect(ld.itemListElement[0]!.position).toBe(1);
  });

  it("handles empty array", () => {
    const ld = buildBreadcrumbLd([]);
    expect(ld.itemListElement).toHaveLength(0);
  });
});

describe("buildFaqLd", () => {
  it("returns FAQPage with mainEntity array", () => {
    const faqs = [
      { question: "چطور ثبت‌نام کنم؟", answer: "به صفحه ثبت‌نام بروید." },
    ];
    const ld = buildFaqLd(faqs);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(1);
    expect(ld.mainEntity[0]!.name).toBe("چطور ثبت‌نام کنم؟");
  });

  it("handles multiple FAQ items", () => {
    const faqs = [
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ];
    const ld = buildFaqLd(faqs);
    expect(ld.mainEntity).toHaveLength(2);
  });

  it("handles empty array", () => {
    const ld = buildFaqLd([]);
    expect(ld.mainEntity).toHaveLength(0);
  });
});

describe("buildBaseMetadata", () => {
  it("returns a Metadata object with required fields", () => {
    const meta = buildBaseMetadata();
    expect(meta.title).toBeDefined();
    expect(meta.description).toBeDefined();
    expect(meta.openGraph).toBeDefined();
    expect(meta.twitter).toBeDefined();
    expect(meta.robots).toBeDefined();
    expect(meta.alternates?.canonical).toBe("/");
  });

  it("has default title template", () => {
    const meta = buildBaseMetadata();
    expect(typeof meta.title).not.toBe("string");
    if (typeof meta.title !== "string" && meta.title && "template" in meta.title) {
      expect((meta.title as { template: string }).template).toContain("|");
    }
  });
});

describe("buildOrganizationLd", () => {
  it("contains @graph array with EducationalOrganization and Organization", () => {
    const ld = buildOrganizationLd() as { "@graph": Array<Record<string, unknown>> };
    expect(ld["@graph"]).toHaveLength(2);
    expect(ld["@graph"][0]!["@type"]).toBe("EducationalOrganization");
    expect(ld["@graph"][1]!["@type"]).toBe("Organization");
  });
});

describe("ldJson", () => {
  it("serializes objects to JSON strings", () => {
    const result = ldJson({ foo: "bar" });
    expect(result).toBe('{"foo":"bar"}');
  });

  it("handles nested objects", () => {
    const data = { a: { b: [1, 2, 3] } };
    expect(ldJson(data)).toBe(JSON.stringify(data));
  });
});
