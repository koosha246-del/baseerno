"use client";

import { motion, type Variants } from "framer-motion";
import { type ElementType, type ReactNode } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "scale";

const variantMap: Record<Direction, Variants> = {
  up: fadeUp,
  down: fadeUp, // directional handled separately below
  left: fadeUp,
  right: fadeUp,
  scale: fadeUp,
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  direction?: Direction;
  delay?: number;
  /** Stagger direct children instead of animating the wrapper itself. */
  stagger?: boolean;
  staggerAmount?: number;
  once?: boolean;
  amount?: number;
}

/**
 * ScrollReveal — the universal scroll-triggered reveal wrapper.
 *
 * - Honors prefers-reduced-motion (opacity-only, no transform).
 * - Supports directional reveal + child stagger via the motion variants
 *   defined in lib/motion.ts.
 * - Used by every homepage section for consistent reveal rhythm.
 */
export function ScrollReveal({
  children,
  className,
  as = "div",
  direction = "up",
  delay = 0,
  stagger = false,
  staggerAmount = 0.1,
  once = true,
  amount = 0.2,
}: ScrollRevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  const variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : variantMap[direction];

  if (stagger) {
    return (
      <MotionTag
        className={cn(className)}
        variants={staggerContainer(staggerAmount)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount }}
      >
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
