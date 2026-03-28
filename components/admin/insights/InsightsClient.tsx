'use client';

import { useEffect, useState } from 'react';
import {
  ADMIN_SURVEY_VIEW_OPTIONS,
  DEFAULT_ADMIN_SURVEY_VIEW,
  getAdminSurveyAudienceLabel,
} from '@/lib/admin-survey-utils';
import BarHorizontal from '@/components/admin/charts/BarHorizontal';
import PieDonut from '@/components/admin/charts/PieDonut';
import { useToast } from '@/components/admin/ui/Toast';
import InsightsSkeleton from './InsightsSkeleton';
import { FUNNEL_COLORS, SENTIMENT_COLORS, URGENCY_COLORS } from '@/lib/chart-theme';
import type { AdminSurveyView, AIInsights } from '@/types/admin';

type InsightsView = Exclude<AdminSurveyView, 'all'>;

const VIEW_ACCENTS: Record<
  InsightsView,
  {
    text: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeBorder: string;
    iconBg: string;
    iconBorder: string;
    active: string;
  }
> = {
  parent_condensed: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50',
  },
  parent_long: {
    text: 'text-blue-400',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-500/30',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    active: 'bg-blue-600 text-white shadow-lg shadow-blue-900/50',
  },
  school_admin: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500',
    border: 'border-cyan-500',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    iconBg: 'bg-cyan-500/10',
    iconBorder: 'border-cyan-500/20',
    active: 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50',
  },
};

function ViewToggle({
  view,
  onChange,
}: {
  view: InsightsView;
  onChange: (view: InsightsView) => void;
}) {
  return (
    <div className="bg-[#0c0c0c] border border-white/10 p-1 rounded-xl flex">
      {ADMIN_SURVEY_VIEW_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            view === option.id ? VIEW_ACCENTS[option.id].active : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function InsightsClient() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set());
  const [view, setView] = useState<InsightsView>(DEFAULT_ADMIN_SURVEY_VIEW);

  useEffect(() => {
    void fetchCachedInsights(view);
  }, [view]);

  const fetchCachedInsights = async (targetView: InsightsView) => {
    setLoading(true);
    setInsights(null);

    try {
      const response = await fetch(`/api/admin/insights?type=${targetView}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.insights) {
        setInsights(data.insights);
        setGeneratedAt(data.generatedAt || data.insights.generatedAt);
        setIsStale(data.stale || false);
      }

      setResponseCount(data.responseCount || 0);
    } catch {
      // Intentionally silent so the empty state can render.
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);

    try {
      const response = await fetch(`/api/admin/insights?type=${view}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setGeneratedAt(data.insights?.generatedAt || new Date().toISOString());
        setIsStale(false);
        setResponseCount(data.responseCount || 0);
        toast('Insights generated successfully', 'success');
      } else {
        const error = await response.json();
        toast(error.error || 'Failed to generate insights', 'error');
      }
    } catch {
      toast('Network error while generating insights', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTheme = (index: number) => {
    setExpandedThemes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  const accent = VIEW_ACCENTS[view];
  const audienceLabel = getAdminSurveyAudienceLabel(view);

  if (loading) {
    return <InsightsSkeleton />;
  }

  if (!insights) {
    return (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-8 ${accent.bg} rounded-full transition-colors`} />
              <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">AI Insights</h1>
              <span
                className={`text-[9px] font-black ${accent.badgeBg} border ${accent.badgeBorder} ${accent.text} px-2 py-0.5 rounded-full uppercase tracking-widest transition-colors`}
              >
                AI
              </span>
            </div>
            <p className="text-white/40 font-medium tracking-wide">
              Aggregate intelligence from {audienceLabel}
            </p>
          </div>

          <ViewToggle view={view} onChange={setView} />
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-16 text-center">
          <div
            className={`w-20 h-20 ${accent.iconBg} border ${accent.iconBorder} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors`}
          >
            <svg className={`w-10 h-10 ${accent.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Generate AI Insights</h3>
          <p className="text-white/30 text-sm font-medium mb-8 max-w-md mx-auto">
            Analyze {responseCount} {audienceLabel} to uncover sentiment patterns, key themes, urgency distribution, and actionable recommendations.
          </p>
          <button
            onClick={generateInsights}
            disabled={generating}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 ${
              isStale ? 'bg-amber-500 text-black animate-pulse' : 'bg-white text-black'
            }`}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Generate Insights'
            )}
          </button>
        </div>
      </div>
    );
  }

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

  const themeData = (insights.themes || []).map((theme, index) => ({
    name: theme.theme.length > 30 ? `${theme.theme.slice(0, 30)}...` : theme.theme,
    value: theme.count,
    color: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
  }));

  const metrics = insights.keyMetrics;
  const urgencyColor =
    (metrics?.avgUrgency || 0) >= 7
      ? 'text-red-400'
      : (metrics?.avgUrgency || 0) >= 4
      ? 'text-orange-400'
      : 'text-emerald-400';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-8 ${accent.bg} rounded-full transition-colors`} />
            <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">AI Insights</h1>
            <span
              className={`text-[9px] font-black ${accent.badgeBg} border ${accent.badgeBorder} ${accent.text} px-2 py-0.5 rounded-full uppercase tracking-widest transition-colors`}
            >
              AI
            </span>
          </div>
          <p className="text-white/40 font-medium tracking-wide">
            Aggregate intelligence from {responseCount} {audienceLabel}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <ViewToggle view={view} onChange={setView} />

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
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 ${
                isStale ? 'bg-amber-500 text-black animate-pulse' : 'bg-white text-black'
              }`}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : isStale ? (
                'Update Available'
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>
      </div>

      {isStale && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">New Data Available</p>
              <p className="text-white/50 text-xs">New survey responses have arrived since this report was generated.</p>
            </div>
          </div>
          <button
            onClick={generateInsights}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            Start New Analysis
          </button>
        </div>
      )}

      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${accent.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Executive Summary</span>
        </div>
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{insights.executiveSummary}</p>
      </div>

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
          <p
            className={`text-sm font-black uppercase ${
              insights.sentiment?.overall === 'positive'
                ? 'text-emerald-400'
                : insights.sentiment?.overall === 'negative'
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          >
            {insights.sentiment?.overall || '—'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-white/40 font-medium">
                  {item.name}: {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

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
              <span
                className={`text-[10px] font-black uppercase ${
                  insights.urgencyDistribution.dominant === 'critical'
                    ? 'text-red-400'
                    : insights.urgencyDistribution.dominant === 'high'
                    ? 'text-orange-400'
                    : insights.urgencyDistribution.dominant === 'medium'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {insights.urgencyDistribution.dominant} ({insights.urgencyDistribution.dominantPct}%)
              </span>
            </div>
          )}
        </div>
      </div>

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
          {(insights.themes || []).map((theme, index) => (
            <div key={index} className="border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTheme(index)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length] }} />
                  <span className="text-sm font-bold text-white">{theme.theme}</span>
                  <span className="text-[10px] text-white/30 font-mono">{theme.count} mentions</span>
                </div>
                <svg
                  className={`w-4 h-4 text-white/30 transition-transform ${expandedThemes.has(index) ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedThemes.has(index) && theme.relatedQuotes && theme.relatedQuotes.length > 0 && (
                <div className="px-4 pb-4 pt-0 space-y-2 border-t border-white/5">
                  {theme.relatedQuotes.map((quote, quoteIndex) => (
                    <div key={quoteIndex} className="flex gap-2 py-2">
                      <span className="text-white/10 text-xs mt-0.5">“</span>
                      <p className="text-xs text-white/50 italic leading-relaxed">{quote}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Recommendations</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(insights.recommendations || []).map((recommendation, index) => (
            <div key={index} className="border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all space-y-3">
              <p className="text-sm font-bold text-white leading-snug">{recommendation.recommendation}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Confidence</span>
                  <span className="text-[10px] font-bold text-white/50">
                    {Math.round(recommendation.confidence * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      recommendation.confidence >= 0.8
                        ? 'bg-emerald-500'
                        : recommendation.confidence >= 0.5
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${recommendation.confidence * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">{recommendation.supportingData}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
