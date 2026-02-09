'use client';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function InsightsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-8 w-48" />
          <Pulse className="h-4 w-72" />
        </div>
        <Pulse className="h-10 w-40 rounded-xl" />
      </div>

      {/* Executive Summary skeleton */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 space-y-3">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-4 w-full mt-2" />
        <Pulse className="h-4 w-5/6" />
      </div>

      {/* Key Metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 space-y-3">
            <Pulse className="h-3 w-16" />
            <Pulse className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-4">
          <Pulse className="h-3 w-32" />
          <Pulse className="h-48 w-full rounded-xl" />
        </div>
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-4">
          <Pulse className="h-3 w-32" />
          <Pulse className="h-48 w-full rounded-xl" />
        </div>
      </div>

      {/* Themes skeleton */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-4">
        <Pulse className="h-3 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>

      {/* Recommendations skeleton */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-4">
        <Pulse className="h-3 w-32" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Pulse key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
