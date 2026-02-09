'use client';

import type { StepDuration } from '@/types/admin';

interface HeatmapGridProps {
  steps: StepDuration[];
}

function getDropOffColor(pct: number): string {
  if (pct >= 40) return 'bg-red-500/40 border-red-500/30';
  if (pct >= 25) return 'bg-orange-500/30 border-orange-500/20';
  if (pct >= 10) return 'bg-yellow-500/20 border-yellow-500/15';
  return 'bg-emerald-500/15 border-emerald-500/10';
}

function getDropOffTextColor(pct: number): string {
  if (pct >= 40) return 'text-red-400';
  if (pct >= 25) return 'text-orange-400';
  if (pct >= 10) return 'text-yellow-400';
  return 'text-emerald-400';
}

export default function HeatmapGrid({ steps }: HeatmapGridProps) {
  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-white/30 uppercase tracking-widest">No step data yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {steps.map((step, i) => (
        <div
          key={step.stepId}
          className={`rounded-xl border p-3 transition-all hover:scale-[1.02] ${getDropOffColor(step.dropOffPct)}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black text-white/30">
              S{String(i + 1).padStart(2, '0')}
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/60 truncate mb-1" title={step.stepName}>
            {step.stepName}
          </p>
          <p className={`text-lg font-black ${getDropOffTextColor(step.dropOffPct)}`}>
            {step.dropOffPct}%
          </p>
          <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Drop-off</p>
        </div>
      ))}
    </div>
  );
}
