import { ResponseList } from '@/components/admin/ResponseList';
import {
  matchesAdminSurveyView,
  normalizeAdminSurveyView,
} from '@/lib/admin-survey-utils';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { AdminSurveyView } from '@/types/admin';

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
  surveyType: AdminSurveyView;
}

async function getResponses(filters: FilterParams) {
  try {
    const { page, status, search, painCheck, hasVoice, dateFrom, dateTo, tags, surveyType } = filters;

    let voiceSessionIds: Set<string> | null = null;
    if (hasVoice === 'yes' || hasVoice === 'no') {
      const { data: voiceSessions } = await supabaseAdmin.from('voice_recordings').select('session_id');
      voiceSessionIds = new Set((voiceSessions || []).map((voiceSession) => voiceSession.session_id));
    }

    let tagResponseIds: Set<string> | null = null;
    if (tags) {
      const tagIds = tags.split(',').filter(Boolean);
      if (tagIds.length > 0) {
        const { data: tagAssignments } = await supabaseAdmin
          .from('response_tag_assignments')
          .select('response_id')
          .in('tag_id', tagIds);

        tagResponseIds = new Set((tagAssignments || []).map((assignment) => assignment.response_id));
      }
    }

    let query = supabaseAdmin
      .from('survey_responses')
      .select('id, session_id, email, is_completed, current_step, started_at, form_data, survey_type');

    if (status === 'completed') {
      query = query.eq('is_completed', true);
    } else if (status === 'ongoing') {
      query = query.eq('is_completed', false);
    }

    if (surveyType === 'school_admin') {
      query = query.eq('survey_type', 'school_admin');
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,session_id.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('started_at', `${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      query = query.lte('started_at', `${dateTo}T23:59:59.999Z`);
    }

    const { data, error } = await query.order('started_at', { ascending: false });
    if (error) {
      throw error;
    }

    const filteredResponses = (data || []).filter((response) => {
      if (!matchesAdminSurveyView(response, surveyType)) {
        return false;
      }

      if (painCheck && response.form_data?.painCheck !== painCheck) {
        return false;
      }

      if (hasVoice === 'yes' && voiceSessionIds && !voiceSessionIds.has(response.session_id)) {
        return false;
      }

      if (hasVoice === 'no' && voiceSessionIds && voiceSessionIds.has(response.session_id)) {
        return false;
      }

      if (tagResponseIds && !tagResponseIds.has(response.id)) {
        return false;
      }

      return true;
    });

    const totalCount = filteredResponses.length;
    const from = (page - 1) * PAGE_SIZE;
    const paginatedResponses = filteredResponses.slice(from, from + PAGE_SIZE);

    return {
      data: paginatedResponses,
      totalCount,
    };
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
  surveyType?: string;
}

export default async function ResponsesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const surveyType = normalizeAdminSurveyView(params.surveyType || 'all');
  const painCheck = surveyType === 'all' || surveyType === 'parent_long' ? params.painCheck || '' : '';

  const filters: FilterParams = {
    page,
    status: params.status || 'all',
    search: params.search || '',
    painCheck,
    hasVoice: params.hasVoice || '',
    dateFrom: params.dateFrom || '',
    dateTo: params.dateTo || '',
    tags: params.tags || '',
    surveyType,
  };

  const { data: responses, totalCount } = await getResponses(filters);

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-white rounded-full" />
          <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">Intelligence</h1>
        </div>
        <p className="text-white/40 font-medium tracking-wide">
          Deep dive into every intake, voice recording, and market data point
        </p>
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
