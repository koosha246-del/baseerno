import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview";
import { DashboardSkeleton } from "@/components/shared/Skeletons";
import { getCachedRoleCounts, getCachedCountCourses, getCachedCountEnrollments, getCachedTotalRevenue } from "@/lib/db/queries";

/**
 * Dashboard home — role-aware stats + recent activity.
 *
 * Performance:
 *   - All independent queries fire in parallel via Promise.all (no
 *     sequential awaits blocking the page).
 *   - Counts and aggregations route through the cached query layer
 *     (`unstable_cache`, 60s TTL) so the dashboard doesn't hammer
 *     the database on every page load.
 *   - The Suspense boundary streams the rendered HTML as soon as
 *     data is ready; the skeleton stays in place during the wait.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const role = user.role;

  let stats: React.ComponentProps<typeof DashboardOverview>["stats"] = [];
  let recentActivity: React.ComponentProps<typeof DashboardOverview>["recentActivity"] = [];

  if (role === "STUDENT") {
    // 5 queries, all in parallel.
    const [enrollments, grades, certs, courses, statusCounts, avgScore] =
      await Promise.all([
        repository.listEnrollments(user.id, { take: 5 }),
        repository.listGrades(user.id),
        repository.listCertificates(user.id),
        repository.listCourses({ publishedOnly: true, take: 200 }),
        repository.countEnrollmentsByStatus(),
        repository.averageScoreForUser(user.id),
      ]);

    const activeCount = statusCounts.ACTIVE ?? 0;
    const completedCount = statusCounts.COMPLETED ?? 0;

    stats = [
      { label: "دوره فعال", value: toPersianDigits(activeCount), accent: "brand" as const },
      { label: "دوره تکمیل‌شده", value: toPersianDigits(completedCount), accent: "green" as const },
      { label: "میانگین نمرات", value: toPersianDigits(avgScore), accent: "blue" as const },
      { label: "گواهی‌نامه", value: toPersianDigits(certs.length), accent: "amber" as const },
    ];

    const courseById = new Map(courses.map((c) => [c.id, c]));
    recentActivity = enrollments.map((e) => {
      const course = courseById.get(e.courseId);
      return {
        id: e.id,
        title: course?.title ?? "—",
        subtitle: `${toPersianDigits(e.progress)}% پیشرفت`,
        status: e.status === "COMPLETED" ? "تکمیل" : "فعال",
        statusColor: e.status === "COMPLETED" ? "green" : "blue",
      };
    });
  } else if (role === "TEACHER") {
    // 3 queries, all in parallel.
    const [courses, grades, totalRevenue] = await Promise.all([
      repository.listCourses({ mentorId: user.id }),
      repository.listGrades(undefined, user.id),
      repository.teacherRevenue(user.id),
    ]);
    // Resolve student count after we know the course ids.
    const studentCount = await repository.countUniqueStudentsForCourses(
      courses.map((c) => c.id),
    );

    stats = [
      { label: "دوره من", value: toPersianDigits(courses.length), accent: "brand" as const },
      { label: "دانشجویان", value: toPersianDigits(studentCount), accent: "blue" as const },
      { label: "نمرات ثبت‌شده", value: toPersianDigits(grades.length), accent: "amber" as const },
      { label: "درآمد (تومان)", value: toPersianDigits(totalRevenue.toLocaleString()), accent: "green" as const },
    ];

    // Recent activity is the teacher's courses (small list, no extra query).
    recentActivity = courses.slice(0, 5).map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.published ? "منتشرشده" : "پیش‌نویس",
      status: c.published ? "منتشرشده" : "پیش‌نویس",
      statusColor: c.published ? "green" : "amber",
    }));
  } else {
    // ADMIN — 4 cached queries, all in parallel.
    const [roleCounts, courseCount, enrollmentCount, totalRevenue] = await Promise.all([
      getCachedRoleCounts(),
      getCachedCountCourses(),
      getCachedCountEnrollments(),
      getCachedTotalRevenue(),
    ]);
    // Recent activity: only fetch the last 5 enrollments with their
    // course titles (small bounded fetch).
    const [enrollments, courses] = await Promise.all([
      repository.listEnrollments(undefined, { take: 5 }),
      repository.listCourses({ publishedOnly: true, take: 200 }),
    ]);
    const courseById = new Map(courses.map((c) => [c.id, c]));

    stats = [
      {
        label: "کل کاربران",
        value: toPersianDigits(roleCounts.STUDENT + roleCounts.TEACHER + roleCounts.ADMIN),
        accent: "brand" as const,
      },
      { label: "دوره‌ها", value: toPersianDigits(courseCount), accent: "blue" as const },
      { label: "ثبت‌نام‌ها", value: toPersianDigits(enrollmentCount), accent: "amber" as const },
      {
        label: "درآمد کل (تومان)",
        value: toPersianDigits(totalRevenue.toLocaleString()),
        accent: "green" as const,
      },
    ];

    recentActivity = enrollments.map((e) => {
      const course = courseById.get(e.courseId);
      return {
        id: e.id,
        title: course?.title ?? "—",
        subtitle: `وضعیت: ${e.status === "ACTIVE" ? "فعال" : e.status === "COMPLETED" ? "تکمیل" : "ترک"}`,
        status: e.status === "ACTIVE" ? "فعال" : e.status === "COMPLETED" ? "تکمیل" : "ترک",
        statusColor: e.status === "COMPLETED" ? "green" : e.status === "ACTIVE" ? "blue" : "amber",
      };
    });
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardOverview stats={stats} recentActivity={recentActivity} role={role} />
    </Suspense>
  );
}
