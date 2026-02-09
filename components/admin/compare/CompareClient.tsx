'use client';

import { useState } from 'react';
import ResponsePicker from './ResponsePicker';
import ComparisonGrid from './ComparisonGrid';
import { useToast } from '@/components/admin/ui/Toast';
import type { ComparisonData } from '@/types/admin';

interface SelectedResponse {
  sessionId: string;
  email: string;
}

export default function CompareClient() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<SelectedResponse[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = (response: SelectedResponse) => {
    if (selected.length >= 3) return;
    if (selected.some(s => s.sessionId === response.sessionId)) return;
    setSelected(prev => [...prev, response]);
    setComparisonData(null); // Reset comparison when selection changes
  };

  const handleRemove = (sessionId: string) => {
    setSelected(prev => prev.filter(s => s.sessionId !== sessionId));
    setComparisonData(null);
  };

  const runComparison = async () => {
    if (selected.length < 2) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: selected.map(s => s.sessionId) }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setComparisonData(data);
      } else {
        const err = await res.json();
        toast(err.error || 'Comparison failed', 'error');
      }
    } catch {
      toast('Network error during comparison', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-purple-500 rounded-full" />
          <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">Compare</h1>
        </div>
        <p className="text-white/40 font-medium tracking-wide">Side-by-side response analysis with visual difference highlighting</p>
      </div>

      {/* Response Picker */}
      <ResponsePicker
        selected={selected}
        onAdd={handleAdd}
        onRemove={handleRemove}
        maxSelections={3}
      />

      {/* Compare Button */}
      {selected.length >= 2 && !comparisonData && (
        <div className="flex justify-center">
          <button
            onClick={runComparison}
            disabled={loading}
            className="px-8 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Compare {selected.length} Responses
              </span>
            )}
          </button>
        </div>
      )}

      {/* Legend */}
      {comparisonData && (
        <div className="flex items-center gap-6 px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
            <span className="text-[10px] text-white/40 font-medium">Shared across responses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500/10 border border-amber-500/20" />
            <span className="text-[10px] text-white/40 font-medium">Unique to this response</span>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {comparisonData && <ComparisonGrid responses={comparisonData} />}

      {/* Empty state */}
      {!comparisonData && selected.length === 0 && (
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Compare Responses</h3>
          <p className="text-white/30 text-sm font-medium max-w-md mx-auto">
            Search and select 2-3 survey responses to compare them side-by-side. Shared data points will be highlighted in green, unique ones in amber.
          </p>
        </div>
      )}
    </div>
  );
}
