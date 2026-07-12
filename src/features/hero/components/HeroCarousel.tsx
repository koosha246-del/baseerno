"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { carouselSlides } from "../constants";
import type { CarouselSlide, SlideTheme } from "../types";

/** Signature luxury ease shared with the rest of the motion system. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Get the currently active slide's theme, merging with sensible defaults.
 */
export function getActiveTheme(slide: CarouselSlide): SlideTheme {
  return slide.theme;
}

/**
 * HeroCarousel — the rotating background carousel for the hero.
 *
 * Behavior:
 *  • Full-bleed images rotate every 20 seconds (configurable per slide).
 *  • When a new slide appears, the entire page's accent colors smoothly
 *    transition to match that slide's mood (via CSS custom properties).
 *  • A subtle Ken Burns zoom animation keeps the background alive.
 *  • A dark scrim maintains text readability over the photos.
 *  • Progress dots show timing and allow manual navigation.
 *
 * Accessibility:
 *  • Honors prefers-reduced-motion (crossfade only, no zoom).
 *  • Autoplay pauses when the hero is scrolled out of view.
 *  • Dots are real, keyboard-focusable tab buttons.
 */
export function HeroCarousel({ className }: { className?: string }) {
  const slides = carouselSlides;
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: "120px" });

  const activeSlide = slides[active] ?? slides[0]!;

  // Update CSS custom properties on the root when the theme changes.
  // This makes buttons, badges, gradient text, and other accent-colored
  // elements across the page smoothly shift color.
  useEffect(() => {
    const root = document.documentElement;
    const theme = activeSlide.theme;

    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-accent-hover", theme.accentHover);
    root.style.setProperty("--theme-accent-soft", theme.accentSoft);
    root.style.setProperty("--theme-text-gradient", theme.textGradient);
    root.style.setProperty("--theme-brand-gradient", theme.brandGradient);
    root.style.setProperty("--theme-scrim", theme.scrimColor);
  }, [active, activeSlide.theme]);

  // Autoplay — advance to the next slide.
  useEffect(() => {
    if (!inView) return;
    const timer = window.setTimeout(() => {
      setActive((i) => (i + 1) % slides.length);
    }, activeSlide.durationMs);
    return () => window.clearTimeout(timer);
  }, [active, activeSlide.durationMs, inView, slides.length]);

  const goTo = useCallback(
    (i: number) => {
      setActive((i + slides.length) % slides.length);
    },
    [slides.length]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      role="region"
      aria-roledescription="carousel"
      aria-label="گالری پس‌زمینه"
    >
      {/* Focused slide — full-bleed image background */}
      <AnimatePresence initial={false}>
        <FocusedSlide
          key={activeSlide.id}
          slide={activeSlide}
          reduced={reduced}
        />
      </AnimatePresence>

      {/* Readability scrim — dims the image so hero copy stays legible */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-[2]"
        style={{
          background: `linear-gradient(180deg, ${activeSlide.theme.scrimColor} 0%, rgba(0,0,0,0.6) 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Extra side vignette for text readability */}
      <div
        aria-hidden
        className="absolute inset-0 z-[3]"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 40% 50%, transparent 0%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Progress dots */}
      <div
        className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        role="tablist"
        aria-label="انتخاب پس‌زمینه"
      >
        {slides.map((slide, i) => (
          <ProgressDot
            key={slide.id}
            label={slide.label}
            isActive={i === active}
            durationMs={slide.durationMs}
            accentColor={slide.theme.accent}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Focused (full-screen) image slide                                           */
/* -------------------------------------------------------------------------- */

/** Shared entrance/exit for the focused slide. */
const focusVariants: Variants = {
  enter: { opacity: 0, scale: 1.08 },
  center: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.4, ease: EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 1, ease: EASE },
  },
};

/** Reduced-motion variant: gentle crossfade, no zoom. */
const focusVariantsReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.6, ease: "easeIn" } },
};

function FocusedSlide({
  slide,
  reduced,
}: {
  slide: CarouselSlide;
  reduced: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-[1]"
      variants={reduced ? focusVariantsReduced : focusVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {/* Ken Burns slow zoom for visual interest */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{
            duration: slide.durationMs / 1000,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <ImageSlide slide={slide} />
        </motion.div>
      )}
      {reduced && <ImageSlide slide={slide} />}
    </motion.div>
  );
}

/** Renders the actual image filling the entire viewport. */
function ImageSlide({ slide }: { slide: CarouselSlide }) {
  return (
    <Image
      src={slide.src}
      alt={slide.label}
      fill
      sizes="100vw"
      className="object-cover"
      priority
      quality={85}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Progress dot                                                               */
/* -------------------------------------------------------------------------- */

function ProgressDot({
  label,
  isActive,
  durationMs,
  accentColor,
  onClick,
}: {
  label: string;
  isActive: boolean;
  durationMs: number;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "pointer-events-auto relative h-2 overflow-hidden rounded-full bg-white/30 transition-all duration-500",
        isActive ? "w-12" : "w-3 hover:bg-white/60"
      )}
    >
      {/* Active bar background tinted with the slide's accent color */}
      {isActive && (
        <motion.span
          key="fill"
          className="absolute inset-0 block origin-left rounded-full"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: durationMs / 1000, ease: "linear" }}
        />
      )}
    </button>
  );
}
