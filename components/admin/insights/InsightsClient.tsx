'use client';

import { useState, useEffect } from 'react';
import PieDonut from '@/components/admin/charts/PieDonut';
import BarHorizontal from '@/components/admin/charts/BarHorizontal';
import InsightsSkeleton from './InsightsSkeleton';
import { useToast } from '@/components/admin/ui/Toast';
import { SENTIMENT_COLORS, URGENCY_COLORS, FUNNEL_COLORS } from '@/lib/chart-theme';
import type { AIInsights } from '@/types/admin';

export default function InsightsClient() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set());

  // Fetch cached insights on load
  useEffect(() => {
    fetchCachedInsights();
  }, []);

  const fetchCachedInsights = async () => {
    try {
      const res = await fetch('/api/admin/insights');
      if (res.ok) {
        const data = await res.json();
        if (data.insights) {
          setInsights(data.insights);
          setGeneratedAt(data.generatedAt || data.insights.generatedAt);
          setIsStale(data.stale || false);
        }
        setResponseCount(data.responseCount || 0);
      }
    } catch {
      // Silent fail — show empty state
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights);
        setGeneratedAt(data.insights?.generatedAt || new Date().toISOString());
        setIsStale(false);
        setResponseCount(data.responseCount || 0);
        toast('Insights generated successfully', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to generate insights', 'error');
      }
    } catch {
      toast('Network error while generating insights', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTheme = (index: number) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) return <InsightsSkeleton />;

  // Empty state — no insights generated yet
  if (!insights) {
    return (
      <div className="space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">AI Insights</h1>
            <span className="text-[9px] font-black bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest">AI</span>
          </div>
          <p className="text-white/40 font-medium tracking-wide">Aggregate intelligence across all survey responses</p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Generate AI Insights</h3>
          <p className="text-white/30 text-sm font-medium mb-8 max-w-md mx-auto">
            Analyze {responseCount} survey response{responseCount !== 1 ? 's' : ''} to uncover sentiment patterns, key themes, urgency distribution, and actionable recommendations.
          </p>
          <button
            onClick={generateInsights}
            disabled={generating || responseCount === 0}
            className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : 'Generate Insights'}
          </button>
        </div>
      </div>
    );
  }

  // Build chart data
  const sentimentData = insights.sentiment?.distribution
    ? [
        { name: 'Positive', value: insights.sentiment.distribution.positive, color: SENTIMENT_COLORS.positive },
        { name: 'Neutral', value: insights.sentiment.distribution.neutral, color: SENTIMENT_COLORS.neutral },
        { name: 'Negative', value: insights.sentiment.distribution.negative, color: SENTIMENT_COLORS.negative },
      ]
    : [];

  const urgencyData = insights.urgencyDistribution
    ? [
        { name: 'Low', value: insights.urgencyDistribution.low, color: URGENCY_COLORS.low },
        { name: 'Medium', value: insights.urgencyDistribution.medium, color: URGENCY_COLORS.medium },
        { name: 'High', value: insights.urgencyDistribution.high, color: URGENCY_COLORS.high },
        { name: 'Critical', value: insights.urgencyDistribution.critical, color: URGENCY_COLORS.critical },
      ]
    : [];

  const themeData = (insights.themes || []).map((t, i) => ({
    name: t.theme.length > 30 ? t.theme.substring(0, 30) + '...' : t.theme,
    value: t.count,
    color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));

  const metrics = insights.keyMetrics;
  const urgencyColor = (metrics?.avgUrgency || 0) >= 7 ? 'text-red-400' : (metrics?.avgUrgency || 0) >= 4 ? 'text-orange-400' : 'text-emerald-400';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">AI Insights</h1>
            <span className="text-[9px] font-black bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest">AI</span>
          </div>
          <p className="text-white/40 font-medium tracking-wide">
            Aggregate intelligence across {responseCount} response{responseCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {generatedAt && (
            <span className="text-[10px] text-white/30 font-medium">
              {isStale && <span className="text-amber-400 mr-1">Stale</span>}
              Generated {formatTimeAgo(generatedAt)}
            </span>
          )}
          <button
            onClick={generateInsights}
            disabled={generating}
            className="px-4 py-2 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Executive Summary</span>
        </div>
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{insights.executiveSummary}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 group hover:border-white/20 transition-all">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Avg Urgency</p>
          <p className={`text-2xl font-black ${urgencyColor}`}>{metrics?.avgUrgency?.toFixed(1) || '—'}</p>
          <p className="text-[10px] text-white/20 mt-1">out of 10</p>
        </div>
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 group hover:border-white/20 transition-all">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Top Concern</p>
          <p className="text-sm font-bold text-white truncate">{metrics?.topConcern || '—'}</p>
        </div>
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 group hover:border-white/20 transition-all">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Response Rate</p>
          <p className="text-2xl font-black text-emerald-400">{metrics?.responseRate || 0}%</p>
          <p className="text-[10px] text-white/20 mt-1">completion</p>
        </div>
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 group hover:border-white/20 transition-all">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Voice Data</p>
          <p className="text-2xl font-black text-purple-400">{metrics?.totalVoiceMinutes || 0}</p>
          <p className="text-[10px] text-white/20 mt-1">minutes</p>
        </div>
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 group hover:border-white/20 transition-all">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Sentiment</p>
          <p className={`text-sm font-black uppercase ${
            insights.sentiment?.overall === 'positive' ? 'text-emerald-400' :
            insights.sentiment?.overall === 'negative' ? 'text-red-400' : 'text-amber-400'
          }`}>
            {insights.sentiment?.overall || '—'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sentiment Distribution</span>
          </div>
          {sentimentData.length > 0 ? (
            <PieDonut data={sentimentData} height={200} innerRadius={45} outerRadius={70} />
          ) : (
            <div className="flex items-center justify-center h-48 text-white/20 text-xs">No sentiment data</div>
          )}
          <div className="flex justify-center gap-4 mt-4">
            {sentimentData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-white/40 font-medium">{s.name}: {s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Urgency Distribution</span>
          </div>
          {urgencyData.length > 0 ? (
            <PieDonut data={urgencyData} height={200} innerRadius={45} outerRadius={70} />
          ) : (
            <div className="flex items-center justify-center h-48 text-white/20 text-xs">No urgency data</div>
          )}
          {insights.urgencyDistribution && (
            <div className="mt-4 text-center">
              <span className="text-[10px] text-white/30 font-medium">Dominant: </span>
              <span className={`text-[10px] font-black uppercase ${
                insights.urgencyDistribution.dominant === 'critical' ? 'text-red-400' :
                insights.urgencyDistribution.dominant === 'high' ? 'text-orange-400' :
                insights.urgencyDistribution.dominant === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {insights.urgencyDistribution.dominant} ({insights.urgencyDistribution.dominantPct}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Themes */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Key Themes</span>
        </div>

        {themeData.length > 0 && (
          <div className="mb-6">
            <BarHorizontal data={themeData} height={Math.max(200, themeData.length * 40)} />
          </div>
        )}

        <div className="space-y-2">
          {(insights.themes || []).map((theme, i) => (
            <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTheme(i)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }} />
                  <span className="text-sm font-bold text-white">{theme.theme}</span>
                  <span className="text-[10px] text-white/30 font-mono">{theme.count} mentions</span>
                </div>
                <svg
                  className={`w-4 h-4 text-white/30 transition-transform ${expandedThemes.has(i) ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedThemes.has(i) && theme.relatedQuotes && theme.relatedQuotes.length > 0 && (
                <div className="px-4 pb-4 pt-0 space-y-2 border-t border-white/5">
                  {theme.relatedQuotes.map((quote, qi) => (
                    <div key={qi} className="flex gap-2 py-2">
                      <span className="text-white/10 text-xs mt-0.5">&ldquo;</span>
                      <p className="text-xs text-white/50 italic leading-relaxed">{quote}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Recommendations</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(insights.recommendations || []).map((rec, i) => (
            <div key={i} className="border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all space-y-3">
              <p className="text-sm font-bold text-white leading-snug">{rec.recommendation}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Confidence</span>
                  <span className="text-[10px] font-bold text-white/50">{Math.round(rec.confidence * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rec.confidence >= 0.8 ? 'bg-emerald-500' :
                      rec.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${rec.confidence * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">{rec.supportingData}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
