'use client';

import { useState } from 'react';
import type { ResponseAISummary } from '@/types/admin';

interface AISummaryCardProps {
  sessionId: string;
  initialSummary: ResponseAISummary | null;
}

export default function AISummaryCard({ sessionId, initialSummary }: AISummaryCardProps) {
  const [summary, setSummary] = useState<ResponseAISummary | null>(initialSummary);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (forceRefresh = false) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/insights/response-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, forceRefresh }),
      });
      if (res.ok) {
        const { summary: data } = await res.json();
        setSummary(data);
      }
    } catch {
      // silent
    } finally {
      setIsGenerating(false);
    }
  };

  const urgencyColor = (score: number) => {
    if (score >= 9) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (score >= 7) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (score >= 4) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  if (!summary) {
    return (
      <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            AI Analysis
          </h3>
          <button
            onClick={() => generate()}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Analyzing...' : 'Generate Summary'}
          </button>
        </div>
        <p className="text-xs text-white/30">Click generate to create an AI analysis of this response.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          AI Analysis
        </h3>
        <button
          onClick={() => generate(true)}
          disabled={isGenerating}
          className="px-3 py-1.5 bg-white/5 border border-white/5 text-white/40 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Regenerating...' : 'Refresh'}
        </button>
      </div>

      <p className="text-sm text-white/70 leading-relaxed mb-4">{summary.summary}</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`rounded-xl border p-3 text-center ${urgencyColor(summary.urgencyScore)}`}>
          <p className="text-2xl font-black">{summary.urgencyScore}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Urgency</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${urgencyColor(summary.productFitScore)}`}>
          <p className="text-2xl font-black">{summary.productFitScore}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Product Fit</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-sm font-black text-white capitalize">{summary.emotionalTone}</p>
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Tone</p>
        </div>
      </div>

      {summary.primaryConcerns && summary.primaryConcerns.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Primary Concerns</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.primaryConcerns.map((concern, i) => (
              <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-white/60 font-medium">
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
