import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuth, requireAdminAuthFromRequest } from '@/lib/admin-auth';

export async function GET() {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin
      .from('response_tags')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ tags: data || [] });
  } catch (error) {
    console.error('Tags fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { name, color } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('response_tags')
      .insert({ name, color: color || '#3B82F6' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ tag: data });
  } catch (error) {
    console.error('Tag create error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { tagId } = await request.json();
    if (!tagId) return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('response_tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tag delete error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
