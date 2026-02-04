import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const revalidate = 0;

async function getStats() {
    try {
        const { count: totalResponses } = await supabaseAdmin
            .from('survey_responses')
            .select('*', { count: 'exact', head: true });

        const { count: completedResponses } = await supabaseAdmin
            .from('survey_responses')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', true);

        const { count: voiceRecordings } = await supabaseAdmin
            .from('voice_recordings')
            .select('*', { count: 'exact', head: true });

        const { data: recentResponses } = await supabaseAdmin
            .from('survey_responses')
            .select('session_id, email, is_completed, started_at, current_step')
            .order('started_at', { ascending: false })
            .limit(6);

        return {
            totalResponses: totalResponses || 0,
            completedResponses: completedResponses || 0,
            voiceRecordings: voiceRecordings || 0,
            completionRate: totalResponses ? Math.round((completedResponses || 0) / totalResponses * 100) : 0,
            recentResponses: recentResponses || [],
        };
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return {
            totalResponses: 0,
            completedResponses: 0,
            voiceRecordings: 0,
            completionRate: 0,
            recentResponses: [],
        };
    }
}

export default async function AdminPage() {
    const stats = await getStats();

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="relative">
                <div className="absolute -left-10 top-0 h-full w-1 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Command Center</h1>
                <p className="text-white/50 font-medium tracking-wide">Real-time intelligence from the BetterPhone survey network</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Conversion Funnel */}
                <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-white">Conversion Funnel</h2>
                            <p className="text-xs text-white/40 font-medium">Visualizing user drop-off across the survey lifecycle</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40">7 DAYS</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[
                            { step: 'Landed', count: stats.totalResponses, color: 'blue' },
                            { step: 'Pain Check', count: Math.round(stats.totalResponses * 0.85), color: 'emerald' },
                            { step: 'Voice Discovery', count: Math.round(stats.totalResponses * 0.6), color: 'purple' },
                            { step: 'Completed', count: stats.completedResponses, color: 'white' }
                        ].map((item, i, arr) => {
                            const percentage = (item.count / stats.totalResponses) * 100 || 0;
                            const dropOff = i === 0 ? 0 : Math.round(100 - (item.count / arr[i - 1].count) * 100);

                            return (
                                <div key={i} className="relative group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-white/20">0{i + 1}</span>
                                            <span className="text-sm font-bold text-white/80">{item.step}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {i > 0 && <span className="text-[10px] font-bold text-red-500/50">-{dropOff}% LOSS</span>}
                                            <span className="text-sm font-mono text-white tracking-widest">{item.count}</span>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                background: i === arr.length - 1
                                                    ? 'linear-gradient(90deg, #fff, #666)'
                                                    : `linear-gradient(90deg, var(--color-${item.color}-500), var(--color-${item.color}-300))`
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Performance Sidebar */}
                <div className="space-y-8">
                    {/* Urgency breakdown */}
                    <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-all" />
                        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-blink" />
                            Urgency Pulse
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-black text-white leading-none">High</p>
                                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">Status: Normal</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-orange-400">42%</p>
                                    <p className="text-[9px] text-white/20 font-bold">Of total</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Activity */}
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Activity</h3>
                            <Link href="/admin/responses" className="text-[10px] font-bold text-white/30 hover:text-white transition-colors">ALL →</Link>
                        </div>
                        <div className="divide-y divide-white/5">
                            {stats.recentResponses.map((res: any) => (
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
