import { describe, it, expect, vi, beforeEach } from "vitest";
import { cldImage, cldImageWithPreset, IMAGE_PRESETS } from "../image";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

describe("cldImage", () => {
  it("returns local fallback when CLOUDINARY_CLOUD_NAME is not set", () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    expect(cldImage("library/interchange-1")).toBe("/images/library/interchange-1.svg");
  });

  it("returns Cloudinary URL when cloud name is set", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    const url = cldImage("library/interchange-1");
    expect(url).toContain("res.cloudinary.com/demo");
    expect(url).toContain("library/interchange-1");
  });

  it("includes auto format and quality by default", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    const url = cldImage("test");
    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
  });

  it("includes transform options when provided", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    const url = cldImage("test", { width: 400, height: 600, crop: "fit", quality: 80 });
    expect(url).toContain("w_400");
    expect(url).toContain("h_600");
    expect(url).toContain("c_fit");
    expect(url).toContain("q_80");
  });

  it("respects explicit format override", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    const url = cldImage("test", { format: "webp" });
    expect(url).toContain("f_webp");
    expect(url).not.toContain("f_auto");
  });
});

describe("cldImageWithPreset", () => {
  it("returns URL with bookCover preset parameters", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    const url = cldImageWithPreset("library/interchange-1", "bookCover");
    expect(url).toContain("w_400");
    expect(url).toContain("h_600");
    expect(url).toContain("c_fit");
  });

  it("returns URL with courseCard preset parameters", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    const url = cldImageWithPreset("course/p-1", "courseCard");
    expect(url).toContain("w_600");
    expect(url).toContain("h_300");
    expect(url).toContain("c_fill");
  });

  it("falls back to local when Cloudinary is not configured", () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    expect(cldImageWithPreset("test", "thumbnail")).toBe("/images/test.svg");
  });
});

describe("IMAGE_PRESETS", () => {
  it("defines all required presets", () => {
    expect(IMAGE_PRESETS.bookCover).toBeDefined();
    expect(IMAGE_PRESETS.courseCard).toBeDefined();
    expect(IMAGE_PRESETS.hero).toBeDefined();
    expect(IMAGE_PRESETS.thumbnail).toBeDefined();
  });

  it("all presets have width, height, crop and quality", () => {
    for (const [name, preset] of Object.entries(IMAGE_PRESETS)) {
      expect(preset.width, `${name} missing width`).toBeGreaterThan(0);
      expect(preset.height, `${name} missing height`).toBeGreaterThan(0);
      expect(preset.crop, `${name} missing crop`).toBeTruthy();
      expect(preset.quality, `${name} missing quality`).toBeGreaterThan(0);
    }
  });
});
