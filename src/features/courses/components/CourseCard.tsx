"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, PlayCircle, ArrowLeft, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { CoursePrice } from "@/components/shared/CoursePrice";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { accentClasses } from "../constants";
import { staggerItem } from "@/lib/motion";
import type { Course, CourseLevel } from "../types";

interface CourseCardProps {
  course: Course;
}

const levelClass: Record<CourseLevel, string> = {
  مقدماتی: "bg-green-50 text-green-700",
  متوسط: "bg-blue-50 text-blue-700",
  پیشرفته: "bg-orange-50 text-orange-700",
  حرفه‌ای: "bg-amber-50 text-amber-700",
};

/**
 * CourseCard — single course tile in the popular-courses grid.
 *
 * Cover (gradient + glyph), level + bestseller badges, title, mentor row,
 * meta (rating, duration, lessons), and price + CTA. Reveals via stagger.
 */
export function CourseCard({ course }: CourseCardProps) {
  const {
    title,
    subtitle,
    level,
    mentor,
    mentorInitial,
    rating,
    reviews,
    durationHours,
    lessons,
    price,
    originalPrice,
    bestseller,
    accent,
    glyph,
    id,
  } = course;

  return (
    <motion.article
      variants={staggerItem}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-app-border-subtle bg-surface shadow-sm transition-all duration-slow ease-luxury hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-lg"
    >
      {/* Cover */}
      <div
        className={cn(
          "relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br",
          accentClasses[accent]
        )}
      >
        <span className="text-6xl opacity-90 transition-transform duration-slow ease-luxury group-hover:scale-110">
          {glyph}
        </span>

        {/* Top badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span
            className={cn(
              "rounded-pill px-2.5 py-1 text-[0.7rem] font-bold",
              levelClass[level]
            )}
          >
            {level}
          </span>
          {bestseller ? (
            <Badge variant="brand" className="shadow-glow">
              <BadgeCheck className="size-3.5" />
              پرفروش
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-fg-primary">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-fg-secondary">
          {subtitle}
        </p>

        {/* Mentor */}
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {mentorInitial}
          </span>
          <span className="text-xs font-medium text-fg-secondary">{mentor}</span>
        </div>

        {/* Rating + meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-app-border-subtle pt-3">
          <RatingStars value={rating} count={reviews} size={14} />
          <div className="flex items-center gap-3 text-xs font-medium text-fg-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {toPersianDigits(durationHours)} ساعت
            </span>
            <span className="flex items-center gap-1">
              <PlayCircle className="size-3.5" />
              {toPersianDigits(lessons)} درس
            </span>
          </div>
        </div>

        {/* Footer: price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <CoursePrice amount={price} originalAmount={originalPrice} />
          <Button
            asChild
            variant="solid"
            size="sm"
            className="group/btn shadow-sm"
          >
            <Link href={`/courses/${id}`} aria-label={`ثبت‌نام در دوره ${title}`}>
              ثبت‌نام
              <ArrowLeft className="size-4 transition-transform duration-base ease-luxury group-hover/btn:-translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
