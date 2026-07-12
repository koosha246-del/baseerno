"use client";

import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Award,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { StatCounter } from "@/components/shared/StatCounter";
import { formatCompactFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { tintClasses, type AchievementIconKey } from "../constants";
import type { AchievementStat } from "../types";
import { staggerItem } from "@/lib/motion";

const iconMap: Record<AchievementIconKey, LucideIcon> = {
  users: Users,
  "graduation-cap": GraduationCap,
  award: Award,
  briefcase: Briefcase,
};

interface StatCardProps {
  stat: AchievementStat;
}

/**
 * StatCard — single achievement metric card.
 * Renders the count-up value (compact Persian) with a tinted icon chip.
 */
export function StatCard({ stat }: StatCardProps) {
  const { iconKey, value, suffix, label, tint, id } = stat;
  const Icon = iconMap[iconKey];
  const compact = value >= 1000 ? formatCompactFa(value) : null;

  return (
    <motion.div
      variants={staggerItem}
      className="group relative overflow-hidden rounded-2xl border border-app-border-subtle bg-surface p-6 text-center shadow-sm transition-all duration-slow ease-luxury hover:-translate-y-1 hover:border-accent/30 hover:shadow-md"
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-brand-gradient opacity-0 transition-opacity duration-slow group-hover:opacity-100" />

      <span
        className={cn(
          "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl transition-transform duration-slow ease-luxury group-hover:scale-110",
          tintClasses[tint]
        )}
      >
        <Icon className="size-7" strokeWidth={2} />
      </span>

      <div
        className="font-display text-3xl font-extrabold text-fg-primary sm:text-4xl"
        aria-describedby={`${id}-label`}
      >
        {compact ? (
          <span>
            {compact}
            {suffix}
          </span>
        ) : (
          <StatCounter value={value} suffix={suffix} />
        )}
      </div>

      <p
        id={`${id}-label`}
        className="mt-2 text-sm font-medium text-fg-secondary"
      >
        {label}
      </p>
    </motion.div>
  );
}
