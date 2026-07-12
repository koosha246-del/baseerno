"use client";

import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion";
import type { CampusFeature } from "../types";

interface CampusFeatureItemProps {
  feature: CampusFeature;
}

/**
 * CampusFeatureItem — single facility highlight with glyph.
 */
export function CampusFeatureItem({ feature }: CampusFeatureItemProps) {
  const { title, description, glyph } = feature;

  return (
    <motion.div
      variants={staggerItem}
      className="group flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5 shadow-sm transition-all duration-slow ease-luxury hover:-translate-y-1 hover:border-accent/30 hover:shadow-md"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl transition-transform duration-slow ease-luxury group-hover:scale-110 sm:text-3xl">
        {glyph}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base font-bold text-fg-primary">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-fg-secondary">{description}</p>
      </div>
    </motion.div>
  );
}
