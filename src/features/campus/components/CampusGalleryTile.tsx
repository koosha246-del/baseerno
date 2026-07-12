"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { staggerItem } from "@/lib/motion";
import type { CampusGalleryItem } from "../types";

interface CampusGalleryItemProps {
  item: CampusGalleryItem;
}

const aspectClass = {
  square: "aspect-square",
  tall: "aspect-[3/4]",
  wide: "aspect-[4/3]",
} as const;

const imageMap: Record<string, string> = {
  g1: "/campus/main-hall.jpg",
  g2: "/campus/lecture-classroom.jpg",
  g3: "/campus/recording-studio.jpg",
  g4: "/campus/library.jpg",
  g5: "/campus/workspace.jpg",
  g6: "/campus/special-event.jpg",
};

/**
 * CampusGalleryItem — single gallery tile with real image and hover overlay.
 * Uses next/image for automatic optimization (AVIF/WebP), lazy loading,
 * and responsive sizes.
 */
export function CampusGalleryTile({ item }: CampusGalleryItemProps) {
  const { id, label, aspect } = item;
  const src = imageMap[id] ?? "/campus/main-hall.jpg";

  return (
    <motion.figure
      variants={staggerItem}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-app-border-subtle shadow-sm transition-all duration-slow ease-luxury hover:-translate-y-1 hover:shadow-md",
        aspectClass[aspect]
      )}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-slow ease-luxury group-hover:scale-105"
      />

      {/* Gradient scrim for caption legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

      {/* Caption overlay */}
      <figcaption className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10">
        <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {label}
        </span>
      </figcaption>
    </motion.figure>
  );
}
