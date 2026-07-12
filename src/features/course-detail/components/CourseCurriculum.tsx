import { Clock, PlayCircle, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";
import type { CourseCurriculumItem } from "../types";

interface CourseCurriculumProps {
  curriculum: CourseCurriculumItem[];
  className?: string;
}

/**
 * CourseCurriculum — expandable lesson list shown on the detail page.
 */
export function CourseCurriculum({ curriculum, className }: CourseCurriculumProps) {
  const totalMinutes = curriculum.reduce((s, l) => s + l.durationMinutes, 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-fg-primary">سرفصل‌های دوره</h3>
        <span className="text-sm text-fg-secondary">
          {toPersianDigits(curriculum.length)} درس • {toPersianDigits(Math.round(totalMinutes / 60))} ساعت
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-app-border-subtle overflow-hidden rounded-2xl border border-app-border-subtle bg-surface">
        {curriculum.map((lesson, idx) => (
          <li
            key={lesson.id}
            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-subtle"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              {lesson.free ? (
                <Unlock className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-fg-primary">
                {toPersianDigits(idx + 1)}. {lesson.title}
                {lesson.free ? (
                  <span className="rounded-pill bg-green-50 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">
                    پیش‌نمایش رایگان
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-3 text-xs text-fg-muted">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {toPersianDigits(lesson.durationMinutes)} دقیقه
                </span>
              </span>
            </div>
            {lesson.free ? (
              <PlayCircle className="size-5 text-accent" />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
