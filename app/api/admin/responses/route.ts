import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminSurveyViewFromResponse,
  getAdminSurveyViewLabel,
  matchesAdminSurveyView,
  normalizeAdminSurveyView,
} from '@/lib/admin-survey-utils';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10)));
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const hasVoice = searchParams.get('hasVoice') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const tags = searchParams.get('tags') || '';
    const surveyType = normalizeAdminSurveyView(searchParams.get('surveyType') || 'all');
    const painCheck = surveyType === 'all' || surveyType === 'parent_long' ? searchParams.get('painCheck') || '' : '';

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

    const filtered = (data || []).filter((response) => {
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

    const totalCount = filtered.length;
    const from = (page - 1) * pageSize;
    const pageData = filtered.slice(from, from + pageSize).map((response) => {
      const surveyView = getAdminSurveyViewFromResponse(response);

      return {
        ...response,
        surveyView,
        surveyLabel: getAdminSurveyViewLabel(surveyView),
      };
    });

    return NextResponse.json({
      data: pageData,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('[Responses API] error:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
