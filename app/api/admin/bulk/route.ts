import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { action, sessionIds, tagId } = await request.json();

    if (!action || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ error: 'Missing action or sessionIds' }, { status: 400 });
    }

    switch (action) {
      case 'delete': {
        const { error } = await supabaseAdmin
          .from('survey_responses')
          .delete()
          .in('session_id', sessionIds);

        if (error) throw error;
        return NextResponse.json({ success: true, deleted: sessionIds.length });
      }

      case 'export': {
        const { data, error } = await supabaseAdmin
          .from('survey_responses')
          .select('*, voice_recordings(*)')
          .in('session_id', sessionIds);

        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'tag': {
        if (!tagId) {
          return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });
        }

        // Get response UUIDs from session IDs
        const { data: responses, error: fetchError } = await supabaseAdmin
          .from('survey_responses')
          .select('id')
          .in('session_id', sessionIds);

        if (fetchError) throw fetchError;

        const assignments = (responses || []).map(r => ({
          response_id: r.id,
          tag_id: tagId,
        }));

        if (assignments.length > 0) {
          const { error } = await supabaseAdmin
            .from('response_tag_assignments')
            .upsert(assignments, { onConflict: 'response_id,tag_id' });
          if (error) throw error;
        }

        return NextResponse.json({ success: true, tagged: assignments.length });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
