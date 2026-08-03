"use client";

import { useState } from "react";
import { Play, FileText } from "lucide-react";
import Link from "next/link";
import { ChatWidget } from "@/features/ai/ChatWidget";

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
  const activeLesson = lessons.find((l) => l.id === activeLessonId);

  return (
    <div className="flex min-h-screen bg-slate-950" dir="rtl">
      {/* Sidebar - lesson list */}
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
              onClick={() => setActiveLessonId(lesson.id)}
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

      {/* AI tutor — grounded in the active course & lesson */}
      <ChatWidget courseId={course.id} lessonTitle={activeLesson?.title} />

      {/* Main content */}
      <main className="flex-1">
        {activeLesson ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="flex aspect-video w-full max-w-4xl items-center justify-center rounded-xl bg-slate-800">
              {activeLesson.videoUrl ? (
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
            <h1 className="mt-6 text-2xl font-bold text-white">{activeLesson.title}</h1>
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
