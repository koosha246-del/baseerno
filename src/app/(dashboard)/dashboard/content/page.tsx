import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { Video, FileCheck, BookOpen } from "lucide-react";
import { CourseForm } from "./CourseForm";
import { LessonForm } from "./LessonForm";

export default async function ContentPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const courses = await repository.listCourses({ mentorId: user.id });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">محتوا و درس‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">مدیریت دوره‌ها و درس‌ها</p>
        </div>
        <CourseForm />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-12 text-center">
          <BookOpen className="mx-auto size-12 text-slate-600" />
          <p className="mt-4 text-slate-400">هنوز دوره‌ای ایجاد نکرده‌اید.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {courses.map((course) => (
            <CourseLessons key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

async function CourseLessons({ course }: { course: { id: string; title: string; published: boolean } }) {
  const lessons = await repository.listAllLessons(course.id);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{course.title}</h2>
          <span className={`text-xs ${course.published ? "text-emerald-400" : "text-amber-400"}`}>
            {course.published ? "منتشرشده" : "پیش‌نویس"}
          </span>
        </div>
        <LessonForm courseId={course.id} />
      </div>

      {lessons.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">هنوز درسی اضافه نشده.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {l.type === "video" ? (
                  <Video className="size-4 text-blue-400" />
                ) : (
                  <FileCheck className="size-4 text-amber-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{l.title}</span>
                  <span className="text-xs text-slate-400">
                    {toPersianDigits(l.durationMinutes)} دقیقه
                    {l.isFree ? " · رایگان" : ""}
                  </span>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold ${
                l.published ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              }`}>
                {l.published ? "منتشر" : "پیش‌نویس"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
