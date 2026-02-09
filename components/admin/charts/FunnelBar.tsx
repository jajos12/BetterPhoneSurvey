'use client';

import type { FunnelStep } from '@/types/admin';

interface FunnelBarProps {
  steps: FunnelStep[];
  maxCount: number;
}

export default function FunnelBar({ steps, maxCount }: FunnelBarProps) {
  return (
    <div className="space-y-4">
      {steps.map((item, i) => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const prevCount = i > 0 ? steps[i - 1].count : item.count;
        const dropOff = i === 0 ? 0 : prevCount > 0 ? Math.round(100 - (item.count / prevCount) * 100) : 0;

        return (
          <div key={item.stepId} className="relative group">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 w-5 text-right">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                  {item.step}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {dropOff > 0 && (
                  <span className="text-[10px] font-bold text-red-500/50">
                    -{dropOff}%
                  </span>
                )}
                <span className="text-xs font-mono text-white/60 tracking-wider">
                  {item.count}
                </span>
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(percentage, 1)}%`,
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
