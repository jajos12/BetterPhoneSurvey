import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const revalidate = 0; // Always fetch fresh data

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
            .select('session_id, email, is_completed, started_at')
            .order('started_at', { ascending: false })
            .limit(5);

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
            <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-text-muted mb-1">Total Responses</p>
                    <p className="text-3xl font-bold text-primary">{stats.totalResponses}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-text-muted mb-1">Completed</p>
                    <p className="text-3xl font-bold text-success">{stats.completedResponses}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-text-muted mb-1">Completion Rate</p>
                    <p className="text-3xl font-bold text-accent">{stats.completionRate}%</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-text-muted mb-1">Voice Recordings</p>
                    <p className="text-3xl font-bold text-primary-light">{stats.voiceRecordings}</p>
                </div>
            </div>

            {/* Recent Responses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-semibold">Recent Responses</h2>
                    <Link href="/admin/responses" className="text-sm text-primary hover:underline">
                        View all →
                    </Link>
                </div>

                <div className="divide-y divide-gray-100">
                    {stats.recentResponses.length === 0 ? (
                        <p className="p-6 text-text-muted text-center">No responses yet</p>
                    ) : (
                        stats.recentResponses.map((response: any) => (
                            <Link
                                key={response.session_id}
                                href={`/admin/responses/${response.session_id}`}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm">
                                        {response.email || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {new Date(response.started_at).toLocaleDateString()} at{' '}
                                        {new Date(response.started_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${response.is_completed
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {response.is_completed ? 'Complete' : 'Partial'}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
