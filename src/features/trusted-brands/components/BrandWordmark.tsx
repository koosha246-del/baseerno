import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandLogo } from "../constants";

interface BrandWordmarkProps {
  brand: BrandLogo;
  className?: string;
}

const logoMap: Record<string, string> = {
  "بانک ملت": "/brands/mellat.svg",
  "ایران‌خودرو": "/brands/irankhodro.svg",
  "همشهری": "/brands/hamshahri.svg",
  "دیجی‌کالا": "/brands/digikala.svg",
  "اسنپ": "/brands/snapp.svg",
  "شتاب‌دهنده مونتاژ": "/brands/montaj.svg",
  "تپسی": "/brands/tapsi.svg",
  "بانک پاسارگاد": "/brands/pasargad.svg",
};

/**
 * BrandWordmark — SVG-based logo for the trusted-brands marquee.
 * Renders a real brand wordmark image for crisp, themeable, and
 * zero layout-shift display in the marquee strip.
 */
export function BrandWordmark({ brand, className }: BrandWordmarkProps) {
  const src = logoMap[brand.name] ?? "/brands/mellat.svg";

  return (
    <div
      className={cn(
        "mx-3 flex min-w-[180px] items-center justify-center rounded-2xl border border-app-border-subtle bg-surface p-2 shadow-sm transition-all duration-slow ease-luxury hover:-translate-y-1 hover:border-accent/30 hover:shadow-md sm:min-w-[200px]",
        className
      )}
    >
      <Image
        src={src}
        alt={brand.name}
        width={200}
        height={60}
        className="h-12 w-auto rounded-xl"
        unoptimized
      />
    </div>
  );
}
