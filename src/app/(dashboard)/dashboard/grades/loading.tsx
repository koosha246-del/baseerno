import { TableSkeleton } from "@/components/shared/Skeletons";

export default function GradesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-700" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-700/50" />
      </div>
      <TableSkeleton />
    </div>
  );
}
