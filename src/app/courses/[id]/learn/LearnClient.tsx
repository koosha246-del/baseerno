"use client";

import { useState } from "react";
import { Play, FileText, List, X } from "lucide-react";
import Link from "next/link";
import { ChatWidget } from "@/features/ai/ChatWidget";

/** Only allow http/https URLs for iframe src to prevent XSS. */
function isSafeVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  durationMinutes: number;
  sortOrder: number;
  isFree: boolean;
  published: boolean;
}

interface Props {
  course: { id: string; title: string };
  lessons: Lesson[];
  initialLessonId: string | null;
}

export function LearnClient({ course, lessons, initialLessonId }: Props) {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLesson = lessons.find((l) => l.id === activeLessonId);

  function selectLesson(id: string) {
    setActiveLessonId(id);
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-950" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-slate-900 lg:block">
        <div className="border-b border-white/10 p-4">
          <Link href={`/courses/${course.id}`} className="text-sm text-slate-400 hover:text-white">
            ← بازگشت
          </Link>
          <h2 className="mt-2 font-bold text-white">{course.title}</h2>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => selectLesson(lesson.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeLessonId === lesson.id
                  ? "bg-accent text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {lesson.type === "video" ? (
                <Play className="size-4 shrink-0" />
              ) : (
                <FileText className="size-4 shrink-0" />
              )}
              <span className="truncate">{lesson.title}</span>
              <span className="mr-auto text-xs text-slate-400">{lesson.durationMinutes} د</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile lesson drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-72 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="font-bold text-white">{course.title}</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto p-2">
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    activeLessonId === lesson.id
                      ? "bg-accent text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {lesson.type === "video" ? (
                    <Play className="size-4 shrink-0" />
                  ) : (
                    <FileText className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{lesson.title}</span>
                  <span className="mr-auto text-xs text-slate-400">{lesson.durationMinutes} د</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {/* AI tutor */}
      <ChatWidget courseId={course.id} lessonTitle={activeLesson?.title} />

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {activeLesson ? (
          <div className="flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Mobile: lesson menu toggle */}
            <div className="mb-4 w-full max-w-4xl lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white"
              >
                <List className="size-4" />
                <span className="truncate">{activeLesson.title}</span>
                <span className="mr-auto text-xs text-slate-400">
                  {activeLesson.durationMinutes} دقیقه
                </span>
              </button>
            </div>

            <div className="flex aspect-video w-full max-w-4xl items-center justify-center rounded-xl bg-slate-800">
              {activeLesson.videoUrl && isSafeVideoUrl(activeLesson.videoUrl) ? (
                <iframe
                  src={activeLesson.videoUrl}
                  className="size-full rounded-xl"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <Play className="size-16" />
                  <p className="text-lg">ویدیو در دسترس نیست</p>
                </div>
              )}
            </div>
            <h1 className="mt-6 text-xl font-bold text-white sm:text-2xl">{activeLesson.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{activeLesson.durationMinutes} دقیقه</p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-400">درسی انتخاب نشده</p>
          </div>
        )}
      </main>
    </div>
  );
}
