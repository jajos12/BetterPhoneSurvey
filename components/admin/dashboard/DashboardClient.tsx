'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import AreaTimeChart from '@/components/admin/charts/AreaTimeChart';
import FunnelBar from '@/components/admin/charts/FunnelBar';
import PieDonut from '@/components/admin/charts/PieDonut';
import HeatmapGrid from '@/components/admin/charts/HeatmapGrid';
import { CHART_COLORS, URGENCY_COLORS } from '@/lib/chart-theme';
import type { DashboardStats, RecentResponse } from '@/types/admin';

interface DashboardClientProps {
  initialStats: DashboardStats;
}

export default function DashboardClient({ initialStats }: DashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLive, setIsLive] = useState(false);
  const [view, setView] = useState<'parent' | 'school_admin'>('parent');
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async (type?: 'parent' | 'school_admin') => {
    const targetType = type || view;
    // Don't set loading on background refresh, only on manual toggle
    try {
      const res = await fetch(`/api/admin/stats?type=${targetType}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently fail on refresh
    }
    setIsLoading(false);
  }, [view]);

  // Handle toggle change
  const handleViewChange = (newView: 'parent' | 'school_admin') => {
    if (newView === view) return;
    setView(newView);
    setIsLoading(true);
    refreshStats(newView);
  };

  // Supabase Realtime subscription (graceful failure)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel('admin-dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_responses' }, () => refreshStats())
        .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED') => {
          if (status === 'SUBSCRIBED') setIsLive(true);
          else if (status === 'CHANNEL_ERROR') setIsLive(false);
        });
    } catch (e) { setIsLive(false); }

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [refreshStats]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => refreshStats(), 60000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const urgencyPieData = [
    { name: 'Low', value: stats.urgency.low, color: URGENCY_COLORS.low },
    { name: 'Medium', value: stats.urgency.medium, color: URGENCY_COLORS.medium },
    { name: 'High', value: stats.urgency.high, color: URGENCY_COLORS.high },
    { name: 'Critical', value: stats.urgency.critical, color: URGENCY_COLORS.critical },
  ];

  const urgencyDominantColor = URGENCY_COLORS[stats.urgency.dominant as keyof typeof URGENCY_COLORS] || URGENCY_COLORS.low;
  const accentColor = view === 'school_admin' ? 'cyan' : 'blue';

  return (
    <div className={`space-y-10 ${isLoading ? 'opacity-70 pointer-events-none transition-opacity' : ''}`}>
      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className={`absolute -left-10 top-0 h-full w-1 ${view === 'school_admin' ? 'bg-cyan-500' : 'bg-white'} rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-colors`} />
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Command Center</h1>
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
              </span>
            )}
          </div>
          <p className="text-white/50 font-medium tracking-wide">Real-time intelligence from {view === 'parent' ? 'parent families' : 'school administrators'}</p>
        </div>

        {/* View Toggle */}
        <div className="bg-[#0c0c0c] border border-white/10 p-1 rounded-xl flex">
          <button
            onClick={() => handleViewChange('parent')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'parent'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
          >
            Parents
          </button>
          <button
            onClick={() => handleViewChange('school_admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'school_admin'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50'
              : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
          >
            School Admins
          </button>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Intake', value: stats.totalResponses, color: 'blue', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Completed', value: stats.completedResponses, color: 'emerald', icon: 'M5 13l4 4L19 7' },
          { label: 'Efficiency', value: `${stats.completionRate}%`, color: 'orange', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'Voice Data', value: stats.voiceRecordings, color: 'purple', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' }
        ].map((item, i) => (
          <div key={i} className="group relative bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 transition-all hover:border-white/20 hover:bg-[#111111] overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${item.color}-500 opacity-20 group-hover:opacity-100 transition-opacity`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-${item.color}-500/10 text-${item.color}-400`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Live Flow</span>
            </div>
            <p className="text-4xl font-black text-white mb-1 tracking-tighter">{item.value}</p>
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em]">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Time Series Chart */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Response Trends</h2>
            <p className="text-xs text-white/40 font-medium">Daily submissions and completions over the last 30 days</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Started</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Completed</span>
            </div>
          </div>
        </div>
        <AreaTimeChart
          data={stats.timeSeries.daily}
          xKey="date"
          lines={[
            { key: 'started', color: CHART_COLORS.primary, name: 'Started' },
            { key: 'completed', color: CHART_COLORS.success, name: 'Completed' },
          ]}
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversion Funnel */}
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-white">Conversion Funnel</h2>
              <p className="text-xs text-white/40 font-medium">Real user progression through each survey step</p>
            </div>
          </div>
          <FunnelBar steps={stats.funnel} maxCount={stats.totalResponses} />
        </div>

        {/* Performance Sidebar */}
        <div className="space-y-6">
          {/* Urgency Pulse - REAL DATA */}
          <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full transition-all" style={{ backgroundColor: `${urgencyDominantColor}15` }} />
            <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: urgencyDominantColor }} />
              Urgency Pulse
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black text-white leading-none capitalize">{stats.urgency.dominant}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase mt-1">Dominant Level</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: urgencyDominantColor }}>{stats.urgency.dominantPct}%</p>
                  <p className="text-[9px] text-white/20 font-bold">Of analyzed</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <PieDonut data={urgencyPieData} height={180} innerRadius={40} outerRadius={65} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Activity</h3>
              <Link href="/admin/responses" className="text-[10px] font-bold text-white/30 hover:text-white transition-colors">ALL &rarr;</Link>
            </div>
            <div className="divide-y divide-white/5">
              {stats.recentResponses.map((res: RecentResponse) => (
                <Link key={res.session_id} href={`/admin/responses/${res.session_id}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20">
                    <span className="text-[10px] font-black text-white/40">{res.email ? res.email[0].toUpperCase() : '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{res.email || 'Anonymous Collector'}</p>
                    <p className="text-[10px] text-white/20 font-mono italic">
                      {new Date(res.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${res.is_completed ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                </Link>
              ))}
              {stats.recentResponses.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs text-white/30">No responses yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step Engagement Heatmap */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Step Engagement Heatmap</h2>
          <p className="text-xs text-white/40 font-medium">Drop-off rate per survey step &mdash; red indicates high abandonment</p>
        </div>
        <HeatmapGrid steps={stats.stepDurations} />
      </div>

      {/* Quick Actions */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <p className="text-xs text-white/40 font-medium">Shortcuts to common operations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/insights"
            className="group flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/10 transition-all"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">AI Insights</p>
              <p className="text-[10px] text-white/30 font-medium">Generate aggregate analysis</p>
            </div>
          </Link>
          <Link
            href="/admin/compare"
            className="group flex items-center gap-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl hover:border-purple-500/30 hover:bg-purple-500/10 transition-all"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Compare</p>
              <p className="text-[10px] text-white/30 font-medium">Side-by-side response analysis</p>
            </div>
          </Link>
          {stats.recentResponses.length > 0 && (
            <Link
              href={`/admin/responses/${stats.recentResponses[0].session_id}`}
              className="group flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Latest Response</p>
                <p className="text-[10px] text-white/30 font-medium truncate">{stats.recentResponses[0].email || 'Anonymous'}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
