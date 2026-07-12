export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-700" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-700/50" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-white/10 bg-slate-800/50" />
      <div className="h-48 animate-pulse rounded-xl border border-white/10 bg-slate-800/50" />
    </div>
  );
}
