import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export interface ResponsiveImageProps extends ImageProps {
  /** Force priority loading (LCP). */
  priority?: boolean;
}

/**
 * ResponsiveImage — opinionated Next/Image wrapper.
 *
 * Enforces the image-performance contract required by the brief:
 *  - `placeholder="blur"` when a `blurDataURL` is provided
 *  - `sizes` required for correct responsive loading
 *  - optional `priority` for LCP imagery
 */
export function ResponsiveImage({
  alt,
  className,
  sizes,
  priority,
  ...props
}: ResponsiveImageProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        alt={alt}
        className="h-full w-full object-cover"
        sizes={sizes ?? "100vw"}
        priority={priority}
        placeholder={props.blurDataURL ? "blur" : "empty"}
        {...props}
      />
    </div>
  );
}
