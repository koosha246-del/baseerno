import { TableSkeleton } from "@/components/shared/Skeletons";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-700" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-700/50" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-700/50" />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}
