"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Play, Mic, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/shared/GradientText";
import { heroData } from "../constants";
import { staggerContainer, staggerItem, EASE } from "@/lib/motion";

const iconMap = {
  Mic,
  Award,
  Users,
} as const;

/**
 * HeroContent — headline, subcopy, CTAs, trust chips, and stat row.
 * The visual focal point of the page; reveals with a stagger on load.
 */
export function HeroContent() {
  const {
    badge,
    titleLead,
    titleHighlight,
    titleTail,
    description,
    primaryCta,
    secondaryCta,
    stats,
    features,
  } = heroData;

  return (
    <motion.div
      variants={staggerContainer(0.08, 0.05)}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col items-start gap-6"
    >
      {/* Badge */}
      <motion.div variants={staggerItem}>
        <span className="inline-flex -rotate-1 items-center gap-2 rounded-md border-2 border-accent bg-accent-soft px-4 py-2 text-sm font-bold text-accent shadow-[3px_3px_0_#f2c14e]">
          {badge}
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        variants={staggerItem}
        className="max-w-2xl font-display text-4xl font-black leading-[1.2] tracking-[-0.03em] text-fg-primary sm:text-6xl lg:text-[4.25rem] lg:leading-[1.08]"
      >
        {titleLead}{" "}
        <GradientText className="font-extrabold">{titleHighlight}</GradientText>{" "}
        {titleTail}
      </motion.h1>

      {/* Description */}
      <motion.p
        variants={staggerItem}
        className="max-w-xl text-base leading-loose text-fg-secondary sm:text-lg"
      >
        {description}
      </motion.p>

      {/* CTAs */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Button asChild variant="brand" size="lg" className="shadow-glow group/btn">
          <a href={primaryCta.href}>
            {primaryCta.label}
            <ArrowLeft className="size-5 transition-transform duration-base ease-luxury group-hover/btn:-translate-x-1" />
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={secondaryCta.href}>
            <Play className="size-4" />
            {secondaryCta.label}
          </a>
        </Button>
      </motion.div>

      {/* Feature chips */}
      <motion.ul
        variants={staggerItem}
        className="flex flex-wrap items-center gap-x-5 gap-y-2"
      >
        {features.map((f) => {
          const Icon = iconMap[f.icon as keyof typeof iconMap];
          return (
            <li key={f.title} className="flex items-center gap-2 text-sm font-semibold text-fg-primary">
              <span className="flex size-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon className="size-4" />
              </span>
              {f.title}
            </li>
          );
        })}
      </motion.ul>

      {/* Stats */}
      <motion.dl
        variants={staggerItem}
        className="mt-2 grid w-full max-w-lg grid-cols-3 gap-0 border-y-2 border-fg-primary bg-surface"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col border-l border-app-border p-3 last:border-l-0">
            <dt className="sr-only">{stat.label}</dt>
            <dd
              className="font-display text-2xl font-extrabold text-fg-primary sm:text-3xl"
              style={{ transition: `transform 0.5s ${EASE.join(" ")}` }}
            >
              {stat.value}
            </dd>
            <dd className="mt-1 text-xs font-medium text-fg-secondary sm:text-sm">
              {stat.label}
            </dd>
          </div>
        ))}
      </motion.dl>
    </motion.div>
  );
}
