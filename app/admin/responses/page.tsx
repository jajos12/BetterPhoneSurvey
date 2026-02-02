import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const revalidate = 0;

async function getResponses() {
    try {
        const { data, error } = await supabaseAdmin
            .from('survey_responses')
            .select('*')
            .order('started_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to fetch responses:', error);
        return [];
    }
}

export default async function ResponsesPage() {
    const responses = await getResponses();
    const completed = responses.filter((r: any) => r.is_completed);
    const inProgress = responses.filter((r: any) => !r.is_completed);

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Responses</h1>
                <p className="text-white/50 text-sm">
                    {responses.length} total · {completed.length} completed · {inProgress.length} in progress
                </p>
            </div>

            {/* Responses Table */}
            <div className="bg-[#16161d] border border-white/10 rounded-xl overflow-hidden">
                {responses.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-white/40">No responses yet</p>
                        <p className="text-white/20 text-sm mt-1">Share your survey to collect data</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-5 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                                <th className="text-left px-5 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Step</th>
                                <th className="text-left px-5 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Started</th>
                                <th className="text-right px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {responses.map((response: any) => (
                                <tr key={response.session_id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm">
                                                    {response.email ? response.email[0].toUpperCase() : '?'}
                                                </span>
                                            </div>
                                            <span className="text-white text-sm font-medium truncate max-w-[180px]">
                                                {response.email || 'Anonymous'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${response.is_completed
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-orange-500/20 text-orange-400'
                                            }`}>
                                            {response.is_completed ? 'Complete' : 'In Progress'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-white/50">
                                        {response.current_step || '—'}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-white/50">
                                        {new Date(response.started_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <Link
                                            href={`/admin/responses/${response.session_id}`}
                                            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
