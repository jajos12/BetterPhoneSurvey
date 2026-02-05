import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';
import { ResponseList } from '@/components/admin/ResponseList';

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
        <div className="space-y-10">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-8 bg-white rounded-full" />
                    <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">Intelligence</h1>
                </div>
                <p className="text-white/40 font-medium tracking-wide">Deep dive into every intake, voice recording, and market data point</p>
            </div>

            <ResponseList responses={responses} />
        </div>
    );
}
