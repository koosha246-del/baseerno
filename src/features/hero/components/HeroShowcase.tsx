"use client";

import { motion } from "framer-motion";
import {
  Award,
  Bell,
  Bot,
  CheckCircle2,
  Play,
  TrendingUp,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { staggerContainer, staggerItem } from "@/lib/motion";

/**
 * HeroShowcase — the homepage's signature visual: a live-looking window of
 * the actual platform, so the product's capabilities are visible above the
 * fold instead of hidden behind marketing copy.
 *
 * Cards inside the window (lesson player, AI tutor chat, live notification)
 * are the real features the platform ships — this answers "قابلیتها دیده
 * نمیشوند" by showing the product itself, not describing it.
 *
 * Decorative-only: the whole block is aria-hidden.
 */
export function HeroShowcase() {
  const reduced = useReducedMotion();

  // Gentle infinite float for the orbiting badges (disabled for reduced motion).
  const float = (delay = 0) =>
    reduced
      ? {}
      : {
          y: [0, -10, 0],
          transition: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay,
          },
        };

  return (
    <motion.div
      variants={staggerContainer(0.1, 0.2)}
      initial="hidden"
      animate="visible"
      className="relative mx-auto w-full max-w-lg"
      aria-hidden
    >
      {/* Hand-cut classroom shapes behind the product preview */}
      <div className="absolute -inset-8 -z-10 organic-frame bg-kid-sunny-100" />
      <div className="absolute -left-6 -top-7 -z-10 size-24 rotate-12 rounded-[40%_60%_55%_45%] bg-kid-coral-200" />
      <div className="absolute -bottom-8 -right-5 -z-10 h-24 w-40 -rotate-6 rounded-[55%_45%_60%_40%] bg-kid-mint-200" />

      {/* Orbiting badge: certificate */}
      <motion.div
        animate={float(0.4)}
        className="absolute -right-3 top-10 z-20 hidden sm:block lg:-right-6"
      >
        <div className="flex -rotate-2 items-center gap-2.5 rounded-md border-2 border-fg-primary bg-surface px-3.5 py-2.5 shadow-md">
          <span className="flex size-9 items-center justify-center rounded-xl bg-kid-mint-100 text-kid-mint-600 dark:bg-kid-mint-500/15 dark:text-kid-mint-300">
            <Award className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-extrabold text-fg-primary">گواهی پایان دوره</span>
            <span className="text-[0.65rem] text-fg-secondary">آماده‌ی دانلود</span>
          </div>
        </div>
      </motion.div>

      {/* Orbiting badge: progress */}
      <motion.div
        animate={float(1.2)}
        className="absolute -left-3 bottom-28 z-20 hidden sm:block lg:-left-6"
      >
        <div className="flex -rotate-2 items-center gap-2.5 rounded-md border-2 border-fg-primary bg-surface px-3.5 py-2.5 shadow-md">
          <span className="flex size-9 items-center justify-center rounded-xl bg-kid-sunny-100 text-kid-sunny-600 dark:bg-kid-sunny-500/15 dark:text-kid-sunny-300">
            <TrendingUp className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-extrabold text-fg-primary">ادامه‌ی مسیر</span>
            <span className="text-[0.65rem] text-fg-secondary">دوره‌ی گرامر</span>
          </div>
        </div>
      </motion.div>

      {/* The platform window */}
      <motion.div
        variants={staggerItem}
        className="editorial-panel organic-frame overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-app-border-subtle bg-surface-muted px-4 py-3">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
          <span
            dir="ltr"
            className="ms-3 flex-1 truncate rounded-full bg-surface px-3 py-1 text-center text-[0.65rem] text-fg-muted"
          >
            baseerno.ir/dashboard
          </span>
        </div>

        {/* Window body — three real features */}
        <div className="space-y-3 p-4 sm:p-5">
          {/* 1 — Lesson player */}
          <div className="relative overflow-hidden rounded-2xl bg-brand-gradient">
            <div className="flex aspect-video items-center justify-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-accent shadow-glow dark:bg-surface dark:text-accent">
                <Play className="size-6 fill-current" />
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-xs font-bold text-white">درس ۴: Present Perfect</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/30">
                <div className="h-full w-2/3 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* 2 — AI tutor chat */}
          <div className="rounded-2xl border border-app-border-subtle bg-surface-muted p-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Bot className="size-4" />
              </span>
              <span className="text-xs font-bold text-fg-primary">دستیار هوشمند</span>
              <span className="ms-auto flex items-center gap-1 text-[0.65rem] font-semibold text-status-success">
                <span className="size-1.5 animate-pulse-soft rounded-full bg-status-success" />
                آنلاین
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              <div className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-ee-sm bg-accent px-3 py-2 text-xs leading-relaxed text-white">
                معنی «look forward to» چیه؟
              </div>
              <div className="w-fit max-w-[85%] rounded-2xl rounded-es-sm bg-surface px-3 py-2 text-xs leading-relaxed text-fg-primary shadow-sm">
                یعنی «مشتاقانه منتظر…» — در پایان ایمیل‌های رسمی استفاده می‌شود. ✍️
              </div>
            </div>
          </div>

          {/* 3 — Live notification */}
          <div className="flex items-center gap-3 rounded-2xl border border-app-border-subtle bg-surface p-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-kid-coral-100 text-kid-coral-600 dark:bg-kid-coral-500/15 dark:text-kid-coral-300">
              <Bell className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold text-fg-primary">نمره‌ی جدید ثبت شد</p>
              <p className="text-[0.65rem] text-fg-secondary">آزمون درس ۴: ۱۸ از ۲۰</p>
            </div>
            <CheckCircle2 className="size-5 text-status-success" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
