"use client";

import { motion } from "framer-motion";
import {
  UsersRound,
  Target,
  TrendingUp,
  Building2,
  BarChart3,
  Award,
  type LucideIcon,
} from "lucide-react";
import { staggerItem } from "@/lib/motion";
import type { CorporateBenefit, CorporateBenefitIcon } from "../types";

const iconMap: Record<CorporateBenefitIcon, LucideIcon> = {
  "users-round": UsersRound,
  target: Target,
  "trending-up": TrendingUp,
  building: Building2,
  "bar-chart": BarChart3,
  award: Award,
};

interface CorporateBenefitCardProps {
  benefit: CorporateBenefit;
}

/**
 * CorporateBenefitCard — single benefit tile in the 3-column grid.
 * Resolves the icon client-side from the icon key (keeps data serializable).
 */
export function CorporateBenefitCard({ benefit }: CorporateBenefitCardProps) {
  const { iconKey, title, description } = benefit;
  const Icon = iconMap[iconKey];

  return (
    <motion.div
      variants={staggerItem}
      className="group flex flex-col gap-3 rounded-2xl border border-app-border-subtle bg-surface p-6 shadow-sm transition-all duration-slow ease-luxury hover:-translate-y-1 hover:border-accent/30 hover:shadow-md"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform duration-slow ease-luxury group-hover:scale-110">
        <Icon className="size-6" strokeWidth={2} />
      </span>
      <h3 className="font-display text-base font-bold text-fg-primary">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-fg-secondary">{description}</p>
    </motion.div>
  );
}
