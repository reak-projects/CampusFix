export default function LoadingSkeleton({ count = 3, type = 'card' }) {
  if (type === 'table') {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-slate-200/80 rounded-lg w-full" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-slate-200 rounded w-1/4" />
            <div className="h-5 bg-slate-200 rounded w-20" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
