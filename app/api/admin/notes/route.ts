import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuth, requireAdminAuthFromRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  const responseId = request.nextUrl.searchParams.get('responseId');
  if (!responseId) return NextResponse.json({ error: 'Missing responseId' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from('admin_notes')
      .select('*')
      .eq('response_id', responseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ notes: data || [] });
  } catch (error) {
    console.error('Notes fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { responseId, content } = await request.json();
    if (!responseId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('admin_notes')
      .insert({ response_id: responseId, content })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (error) {
    console.error('Note create error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { noteId, content } = await request.json();
    if (!noteId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('admin_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', noteId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Note update error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { noteId } = await request.json();
    if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('admin_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Note delete error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
