import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { formatDate } from "@/lib/format";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/Skeletons";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { DownloadCertificateButton } from "./DownloadCertificateButton";

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  return (
    <Suspense fallback={<CardSkeleton />}>
      <CertificatesBody userId={user.id} />
    </Suspense>
  );
}

async function CertificatesBody({ userId }: { userId: string }) {
  const certs = await repository.listCertificates(userId);
  const courses = await repository.listCourses({
    ids: [...new Set(certs.map((c) => c.courseId))],
  });
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">گواهی‌نامه‌ها</h1>
        <p className="mt-1 text-sm text-slate-400">گواهی‌نامه‌های صادرشده دوره‌های تکمیل‌شده</p>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          icon={Award}
          title="هنوز گواهی نداری"
          description="بعد از تمام کردن دوره، گواهی اینجا ظاهر می‌شود."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {certs.map((c) => {
            const course = courseById.get(c.courseId);
            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/10 bg-slate-800/50 p-6 transition-colors hover:border-white/20 hover:bg-slate-800"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Award className="size-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-white">{course?.title ?? "—"}</h3>
                    <span className="text-xs text-slate-400">شماره: {c.certificateNumber}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>تاریخ صدور: {formatDate(c.issueDate, "long")}</span>
                  <DownloadCertificateButton
                    certificateId={c.id}
                    certificateNumber={c.certificateNumber}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
