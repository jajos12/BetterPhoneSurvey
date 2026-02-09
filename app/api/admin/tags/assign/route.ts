import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { responseId, tagId } = await request.json();
    if (!responseId || !tagId) return NextResponse.json({ error: 'Missing responseId or tagId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('response_tag_assignments')
      .upsert({ response_id: responseId, tag_id: tagId }, { onConflict: 'response_id,tag_id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tag assign error:', error);
    return NextResponse.json({ error: 'Failed to assign tag' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { responseId, tagId } = await request.json();
    if (!responseId || !tagId) return NextResponse.json({ error: 'Missing responseId or tagId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('response_tag_assignments')
      .delete()
      .eq('response_id', responseId)
      .eq('tag_id', tagId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tag unassign error:', error);
    return NextResponse.json({ error: 'Failed to unassign tag' }, { status: 500 });
  }
}
