import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const role = user.role;

  let stats: React.ComponentProps<typeof DashboardOverview>["stats"] = [];
  let recentActivity: React.ComponentProps<typeof DashboardOverview>["recentActivity"] = [];

  if (role === "STUDENT") {
    const enrollments = await repository.listEnrollments(user.id);
    const grades = await repository.listGrades(user.id);
    const certs = await repository.listCertificates(user.id);
    const courses = await repository.listCourses();

    const activeCount = enrollments.filter((e) => e.status === "ACTIVE").length;
    const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;
    const avgScore = grades.length
      ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length * 10) / 10
      : 0;

    stats = [
      { label: "دوره فعال", value: toPersianDigits(activeCount), accent: "brand" as const },
      { label: "دوره تکمیل‌شده", value: toPersianDigits(completedCount), accent: "green" as const },
      { label: "میانگین نمرات", value: toPersianDigits(avgScore), accent: "blue" as const },
      { label: "گواهی‌نامه", value: toPersianDigits(certs.length), accent: "amber" as const },
    ];

    recentActivity = enrollments.slice(0, 5).map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return {
        id: e.id,
        title: course?.title ?? "—",
        subtitle: `${toPersianDigits(e.progress)}% پیشرفت`,
        status: e.status === "COMPLETED" ? "تکمیل" : "فعال",
        statusColor: e.status === "COMPLETED" ? "green" : "blue",
      };
    });
  } else if (role === "TEACHER") {
    const courses = await repository.listCourses({ mentorId: user.id });
    const grades = await repository.listGrades(undefined, user.id);
    const revenue = await repository.teacherRevenue(user.id);

    // Get enrollments for this teacher's courses
    const allEnrollments = await repository.listEnrollments();
    const myEnrollments = allEnrollments.filter((e) =>
      courses.some((c) => c.id === e.courseId)
    );
    const totalStudents = new Set(myEnrollments.map((e) => e.userId)).size;

    stats = [
      { label: "دوره من", value: toPersianDigits(courses.length), accent: "brand" as const },
      { label: "دانشجویان", value: toPersianDigits(totalStudents), accent: "blue" as const },
      { label: "نمرات ثبت‌شده", value: toPersianDigits(grades.length), accent: "amber" as const },
      { label: "درآمد (تومان)", value: toPersianDigits(revenue.toLocaleString()), accent: "green" as const },
    ];

    recentActivity = courses.slice(0, 5).map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: `${toPersianDigits(myEnrollments.filter((e) => e.courseId === c.id).length)} دانشجو`,
      status: c.published ? "منتشرشده" : "پیش‌نویس",
      statusColor: c.published ? "green" : "amber",
    }));
  } else {
    // ADMIN
    const counts = await repository.countByRole();
    const courses = await repository.listCourses();
    const revenue = await repository.totalRevenue();
    const enrollments = await repository.listEnrollments();

    stats = [
      { label: "کل کاربران", value: toPersianDigits(counts.STUDENT + counts.TEACHER + counts.ADMIN), accent: "brand" as const },
      { label: "دوره‌ها", value: toPersianDigits(courses.length), accent: "blue" as const },
      { label: "ثبت‌نام‌ها", value: toPersianDigits(enrollments.length), accent: "amber" as const },
      { label: "درآمد کل (تومان)", value: toPersianDigits(revenue.toLocaleString()), accent: "green" as const },
    ];

    recentActivity = enrollments.slice(0, 5).map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return {
        id: e.id,
        title: course?.title ?? "—",
        subtitle: `وضعیت: ${e.status === "ACTIVE" ? "فعال" : e.status === "COMPLETED" ? "تکمیل" : "ترک"}`,
        status: e.status === "ACTIVE" ? "فعال" : e.status === "COMPLETED" ? "تکمیل" : "ترک",
        statusColor: e.status === "COMPLETED" ? "green" : e.status === "ACTIVE" ? "blue" : "amber",
      };
    });
  }

  return <DashboardOverview stats={stats} recentActivity={recentActivity} role={role} />;
}
