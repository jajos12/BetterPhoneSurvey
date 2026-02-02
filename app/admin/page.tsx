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
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-white/50 text-sm">Track survey performance and insights</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Responses */}
                <div className="bg-[#16161d] border border-white/10 rounded-xl p-5">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalResponses}</p>
                    <p className="text-sm text-white/40 mt-1">Total responses</p>
                </div>

                {/* Completed */}
                <div className="bg-[#16161d] border border-white/10 rounded-xl p-5">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.completedResponses}</p>
                    <p className="text-sm text-white/40 mt-1">Completed</p>
                </div>

                {/* Completion Rate */}
                <div className="bg-[#16161d] border border-white/10 rounded-xl p-5">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.completionRate}%</p>
                    <p className="text-sm text-white/40 mt-1">Completion rate</p>
                </div>

                {/* Voice Recordings */}
                <div className="bg-[#16161d] border border-white/10 rounded-xl p-5">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.voiceRecordings}</p>
                    <p className="text-sm text-white/40 mt-1">Voice recordings</p>
                </div>
            </div>

            {/* Recent Responses */}
            <div className="bg-[#16161d] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-base font-semibold text-white">Recent Responses</h2>
                        <p className="text-xs text-white/40 mt-0.5">Latest survey submissions</p>
                    </div>
                    <Link
                        href="/admin/responses"
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        View all →
                    </Link>
                </div>

                {stats.recentResponses.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-white/40">No responses yet</p>
                    </div>
                ) : (
                    <div>
                        {stats.recentResponses.map((response: any) => (
                            <Link
                                key={response.session_id}
                                href={`/admin/responses/${response.session_id}`}
                                className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {response.email ? response.email[0].toUpperCase() : '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">
                                            {response.email || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-white/30">
                                            {new Date(response.started_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/30">
                                        Step {response.current_step || '?'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${response.is_completed
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                        {response.is_completed ? 'Complete' : 'In Progress'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
