import type { AchievementStat } from "./types";

export type AchievementIconKey =
  | "users"
  | "graduation-cap"
  | "award"
  | "briefcase";

export const achievementStats: AchievementStat[] = [
  {
    id: "students",
    iconKey: "users",
    value: 9000,
    suffix: "+",
    label: "دانش‌آموز",
    tint: "violet",
  },
  {
    id: "courses",
    iconKey: "graduation-cap",
    value: 40,
    suffix: "+",
    label: "درس انگلیسی",
    tint: "pink",
  },
  {
    id: "satisfaction",
    iconKey: "award",
    value: 91,
    suffix: "٪",
    label: "تمام‌کردن درس",
    tint: "orchid",
  },
  {
    id: "corporate",
    iconKey: "briefcase",
    value: 30,
    suffix: "+",
    label: "مدرسه همکار",
    tint: "amber",
  },
];

/** Tint map — blue = focus, amber = achievement (color psychology). */
export const tintClasses: Record<AchievementStat["tint"], string> = {
  violet: "bg-accent-soft text-accent",
  pink: "bg-brand-amber/15 text-brand-amber",
  orchid: "bg-brand-blue/15 text-brand-blue",
  amber: "bg-brand-amber/15 text-brand-amber",
};
