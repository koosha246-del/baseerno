export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 rounded-lg bg-slate-700" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-700/50" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-700/50" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl border border-white/10 bg-slate-800/50 p-5">
        <div className="mb-4 h-6 w-32 rounded bg-slate-700" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-700/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-slate-800/50 p-5">
      <div className="mb-4 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded bg-slate-700" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-700/30" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-slate-800/50 p-5">
      <div className="mb-3 h-6 w-48 rounded bg-slate-700" />
      <div className="mb-2 h-4 w-32 rounded bg-slate-700/50" />
      <div className="h-2 w-full rounded-full bg-slate-700/30" />
    </div>
  );
}
