/**
 * Image URL utilities — Cloudinary-based image delivery with local fallback.
 *
 * ## Why Cloudinary?
 * - Automatic format selection (WebP / AVIF when supported).
 * - Responsive image resizing (width, height, crop).
 * - CDN edge caching (fast global delivery).
 * - Image optimisation (quality, compression).
 *
 * ## Usage
 * ```tsx
 * import { cldImage } from "@/lib/image";
 * import Image from "next/image";
 *
 * <Image
 *   src={cldImage("library/interchange-1", { width: 400, height: 600 })}
 *   alt={book.title}
 *   width={400}
 *   height={600}
 * />
 * ```
 *
 * ## Local fallback
 * If `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is not set, `cldImage()` returns
 * a local `/images/{publicId}.svg` path. This ensures the app works in dev
 * environments without Cloudinary credentials. Book cover placeholders live
 * in `public/images/library/{id}.svg`.
 */

/** Cloudinary transformation presets for common use cases. */
export const IMAGE_PRESETS = {
  /** Book cover — 400×600, smart crop. */
  bookCover: { width: 400, height: 600, crop: "fit" as const, quality: 80 },
  /** Course card — 600×300, smart crop. */
  courseCard: { width: 600, height: 300, crop: "fill" as const, quality: 85 },
  /** Hero / banner — 1200×400, smart crop. */
  hero: { width: 1200, height: 400, crop: "fill" as const, quality: 90 },
  /** Thumbnail — 150×150, face-aware crop. */
  thumbnail: { width: 150, height: 150, crop: "thumb" as const, quality: 75 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "thumb" | "scale";
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
}

/**
 * Returns a Cloudinary URL for the given image public ID.
 *
 * When `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is not set, falls back to
 * a local SVG path at `/images/{publicId}.svg`. Book cover placeholders
 * ship as crisp, theme-tinted SVGs so the app boots cleanly in dev and
 * works offline without any external CDN.
 *
 * @param publicId - The Cloudinary public ID (e.g. "library/interchange-1").
 * @param opts - Optional transformation parameters.
 * @returns A fully qualified Cloudinary URL or local fallback path.
 */
export function cldImage(
  publicId: string,
  opts: TransformOptions = {},
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    // Local fallback — SVGs are smaller, infinitely scalable, and look
    // great at any size. The static file server serves them as-is; we
    // intentionally avoid `?w=…&h=…` query params because Next.js 15+
    // blocks query strings in <Image> unless the localPatterns config
    // allows them. SVGs don't need resize params since they scale.
    return `/images/${publicId}.svg`;
  }

  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Build transformation string
  const parts: string[] = [];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.crop) parts.push(`c_${opts.crop}`);
  if (opts.quality) parts.push(`q_${opts.quality}`);
  if (opts.format && opts.format !== "auto") parts.push(`f_${opts.format}`);

  // Default: auto format + auto quality
  if (!opts.format) parts.push("f_auto");
  if (!opts.quality) parts.push("q_auto");

  const transformation = parts.join(",");
  return `${base}/${transformation}/${publicId}`;
}

/**
 * Returns a Cloudinary URL using a named preset.
 *
 * @param publicId - The Cloudinary public ID.
 * @param preset - The preset name (from IMAGE_PRESETS).
 * @returns A Cloudinary URL configured with the preset's parameters.
 */
export function cldImageWithPreset(
  publicId: string,
  preset: ImagePreset,
): string {
  const presetOpts = IMAGE_PRESETS[preset];
  return cldImage(publicId, { ...presetOpts });
}
