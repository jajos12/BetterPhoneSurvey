import { supabaseAdmin } from '@/lib/supabase-server';
import { ResponseList } from '@/components/admin/ResponseList';

export const revalidate = 0;

const PAGE_SIZE = 20;

interface FilterParams {
    page: number;
    status: string;
    search: string;
    painCheck: string;
    hasVoice: string;
    dateFrom: string;
    dateTo: string;
    tags: string;
}

async function getResponses(filters: FilterParams) {
    try {
        const { page, status, search, painCheck, hasVoice, dateFrom, dateTo, tags } = filters;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Prefetch voice session IDs if needed
        let voiceSessionIds: string[] | null = null;
        if (hasVoice === 'yes' || hasVoice === 'no') {
            const { data: voiceSessions } = await supabaseAdmin
                .from('voice_recordings')
                .select('session_id');
            voiceSessionIds = [...new Set((voiceSessions || []).map(v => v.session_id))];
        }

        // Prefetch tag response IDs if needed
        let tagResponseIds: string[] | null = null;
        if (tags) {
            const tagIds = tags.split(',').filter(Boolean);
            if (tagIds.length > 0) {
                const { data: tagAssignments } = await supabaseAdmin
                    .from('response_tag_assignments')
                    .select('response_id')
                    .in('tag_id', tagIds);
                tagResponseIds = [...new Set((tagAssignments || []).map(t => t.response_id))];
            }
        }

        let query = supabaseAdmin
            .from('survey_responses')
            .select('*', { count: 'exact' });

        if (status === 'completed') query = query.eq('is_completed', true);
        else if (status === 'ongoing') query = query.eq('is_completed', false);

        if (search) {
            query = query.or(`email.ilike.%${search}%,session_id.ilike.%${search}%`);
        }

        if (painCheck) {
            query = query.filter('form_data->>painCheck', 'eq', painCheck);
        }

        if (dateFrom) query = query.gte('started_at', `${dateFrom}T00:00:00.000Z`);
        if (dateTo) query = query.lte('started_at', `${dateTo}T23:59:59.999Z`);

        if (hasVoice === 'yes' && voiceSessionIds) {
            if (voiceSessionIds.length === 0) return { data: [], totalCount: 0 };
            query = query.in('session_id', voiceSessionIds);
        } else if (hasVoice === 'no' && voiceSessionIds) {
            if (voiceSessionIds.length > 0) {
                query = query.not('session_id', 'in', `(${voiceSessionIds.join(',')})`);
            }
        }

        if (tagResponseIds !== null) {
            if (tagResponseIds.length === 0) return { data: [], totalCount: 0 };
            query = query.in('id', tagResponseIds);
        }

        query = query.order('started_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data || [], totalCount: count || 0 };
    } catch (error) {
        console.error('Failed to fetch responses:', error);
        return { data: [], totalCount: 0 };
    }
}

interface SearchParams {
    page?: string;
    status?: string;
    search?: string;
    painCheck?: string;
    hasVoice?: string;
    dateFrom?: string;
    dateTo?: string;
    tags?: string;
}

export default async function ResponsesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || '1', 10));

    const filters: FilterParams = {
        page,
        status: params.status || 'all',
        search: params.search || '',
        painCheck: params.painCheck || '',
        hasVoice: params.hasVoice || '',
        dateFrom: params.dateFrom || '',
        dateTo: params.dateTo || '',
        tags: params.tags || '',
    };

    const { data: responses, totalCount } = await getResponses(filters);

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

            <ResponseList
                responses={responses}
                page={page}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                initialFilters={filters}
            />
        </div>
    );
}
