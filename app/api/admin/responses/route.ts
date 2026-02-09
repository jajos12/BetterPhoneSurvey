import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';

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
    const painCheck = searchParams.get('painCheck') || '';
    const hasVoice = searchParams.get('hasVoice') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const tags = searchParams.get('tags') || '';

    // If hasVoice filter is active, prefetch session IDs with voice recordings
    let voiceSessionIds: string[] | null = null;
    if (hasVoice === 'yes' || hasVoice === 'no') {
      const { data: voiceSessions } = await supabaseAdmin
        .from('voice_recordings')
        .select('session_id');
      voiceSessionIds = [...new Set((voiceSessions || []).map(v => v.session_id))];
    }

    // If tag filter is active, prefetch response IDs with those tags
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

    // Build main query
    let query = supabaseAdmin
      .from('survey_responses')
      .select('*', { count: 'exact' });

    // Status filter
    if (status === 'completed') {
      query = query.eq('is_completed', true);
    } else if (status === 'ongoing') {
      query = query.eq('is_completed', false);
    }

    // Search filter (email or session_id)
    if (search) {
      query = query.or(`email.ilike.%${search}%,session_id.ilike.%${search}%`);
    }

    // Pain check filter (JSONB field)
    if (painCheck) {
      query = query.filter('form_data->>painCheck', 'eq', painCheck);
    }

    // Date range filters
    if (dateFrom) {
      query = query.gte('started_at', `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      query = query.lte('started_at', `${dateTo}T23:59:59.999Z`);
    }

    // Voice recording filter
    if (hasVoice === 'yes' && voiceSessionIds) {
      if (voiceSessionIds.length === 0) {
        // No sessions have voice recordings, return empty
        return NextResponse.json({
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
      query = query.in('session_id', voiceSessionIds);
    } else if (hasVoice === 'no' && voiceSessionIds) {
      if (voiceSessionIds.length > 0) {
        query = query.not('session_id', 'in', `(${voiceSessionIds.join(',')})`);
      }
    }

    // Tag filter
    if (tagResponseIds !== null) {
      if (tagResponseIds.length === 0) {
        return NextResponse.json({
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
      query = query.in('id', tagResponseIds);
    }

    // Ordering and pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('started_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const totalCount = count || 0;

    return NextResponse.json({
      data: data || [],
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
