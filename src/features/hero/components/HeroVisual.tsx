"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeroVisual — decorative hero illustration built entirely from CSS/SVG.
 *
 * Uses a brand-gradient framed portrait placeholder, floating glass badges,
 * and an aurora glow. No external image dependency → zero layout shift and
 * perfect LCP from the text content. Decorative-only (aria-hidden).
 */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      {/* Aurora glow */}
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-aurora opacity-80 blur-2xl" />

      {/* Main framed portrait */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-white/40 bg-brand-gradient p-1 shadow-2xl"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-surface-muted">
          {/* Stylized orator silhouette via gradient + SVG */}
           <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-blue-400/15 to-amber-400/20" />
          <svg
            viewBox="0 0 400 500"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4F4F8" />
                <stop offset="100%" stopColor="#DBEAFE" />
              </linearGradient>
              <linearGradient id="figure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E3A5F" />
              </linearGradient>
            </defs>
            {/* Stage floor */}
            <ellipse cx="200" cy="470" rx="180" ry="30" fill="url(#stage)" />
            {/* Podium */}
            <rect x="150" y="350" width="100" height="100" rx="8" fill="url(#figure)" opacity="0.9" />
            {/* Figure */}
            <circle cx="200" cy="240" r="34" fill="url(#figure)" />
            <path d="M150 360 Q200 280 250 360 L250 410 L150 410 Z" fill="url(#figure)" />
            {/* Sound waves emanating */}
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${260 + i * 18} 240 Q ${280 + i * 18} 240 ${280 + i * 18} 220`}
                stroke="#F5C518"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity={0.5 - i * 0.12}
              />
            ))}
            {[0, 1, 2].map((i) => (
              <path
                key={`l${i}`}
                d={`M ${140 - i * 18} 240 Q ${120 - i * 18} 240 ${120 - i * 18} 220`}
                stroke="#2563EB"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity={0.5 - i * 0.12}
              />
            ))}
          </svg>
        </div>
      </motion.div>

      {/* Floating badge: growth */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
        className="absolute -left-6 top-12 z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass flex items-center gap-3 rounded-2xl border border-white/60 px-4 py-3 shadow-lg"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-status-success/15 text-status-success">
            <TrendingUp className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold text-fg-primary">٪۹۶</span>
            <span className="text-[0.7rem] text-fg-secondary">پیشرفت دانش‌آموزان</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating badge: trophy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
        className="absolute -right-4 bottom-24 z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="glass flex items-center gap-3 rounded-2xl border border-white/60 px-4 py-3 shadow-lg"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Trophy className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold text-fg-primary">یادگیری شاد</span>
            <span className="text-[0.7rem] text-fg-secondary">سال ۱۴۰۳</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating quote */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 1 }}
        className="absolute -bottom-6 right-8 z-10 max-w-[14rem]"
      >
        <div className="glass rounded-2xl border border-white/60 p-4 shadow-lg">
          <Quote className="size-5 text-accent" />
          <p className="mt-2 text-xs font-medium leading-relaxed text-fg-primary">
            «هر روز کمی انگلیسی — پیشرفت یعنی همین.»
          </p>
        </div>
      </motion.div>
    </div>
  );
}
