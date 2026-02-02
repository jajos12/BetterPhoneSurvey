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

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">All Responses</h1>
                <p className="text-text-muted">{responses.length} total</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Email</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Status</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Current Step</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Started</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-text-muted"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {responses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                    No responses yet. Share your survey link to start collecting data!
                                </td>
                            </tr>
                        ) : (
                            responses.map((response: any) => (
                                <tr key={response.session_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-sm">
                                            {response.email || 'Anonymous'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${response.is_completed
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {response.is_completed ? 'Complete' : 'Partial'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {response.current_step}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-muted">
                                        {new Date(response.started_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/responses/${response.session_id}`}
                                            className="text-primary hover:underline text-sm"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
