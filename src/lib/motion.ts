import type { Variants, Transition } from "framer-motion";

/**
 * Reusable Framer Motion variants.
 * All use the signature luxury ease [0.22, 1, 0.36, 1] and 0.5–0.8s durations
 * so motion feels subtle, organic, and consistent across the site.
 *
 * Components consume these via the <ScrollReveal> wrapper or directly.
 */

/** Signature luxury ease from the brief: cubic-bezier(0.22, 1, 0.36, 1). */
const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

const springTransition: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 0.9,
};

/** Standard reveal transition shared by directional variants. */
const revealTransition: Transition = {
  duration: 0.7,
  ease: EASE_LUXURY,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: revealTransition,
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: revealTransition,
  },
};

/** RTL-aware: in RTL "left" reveal enters from the visual left. */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: revealTransition,
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: revealTransition,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
};

/** Container that staggers its children's reveal. */
export const staggerContainer = (stagger = 0.1, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

export const staggerItem = fadeUp;

/** Soft infinite floating loop for decorative badges. */
export const floating: Variants = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "mirror",
    },
  },
};

/** Parallax handler — use with useScroll/useTransform in a component. */
export const parallax = (range: number = 60) => ({
  initial: { y: range },
  whileInView: {
    y: 0,
    transition: { duration: 1.1, ease: EASE_LUXURY },
  },
});

/** Marquee config for the trusted-brands strip. */
export const marquee = {
  animate: (duration = 40) => ({
    x: ["0%", "-50%"],
    transition: {
      duration,
      ease: "linear" as const,
      repeat: Infinity,
    },
  }),
};

export const EASE = EASE_LUXURY;
