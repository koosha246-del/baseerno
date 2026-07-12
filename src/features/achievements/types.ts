import type { AchievementIconKey } from "./constants";

export interface AchievementStat {
  id: string;
  /** Icon key resolved client-side via the local icon map. */
  iconKey: AchievementIconKey;
  /** Numeric target for count-up. */
  value: number;
  /** Display suffix (e.g. "+"). */
  suffix?: string;
  /** Persian label. */
  label: string;
  /** Accent tint key. */
  tint: "violet" | "pink" | "orchid" | "amber";
}

export interface AchievementHighlight {
  title: string;
  description: string;
}
