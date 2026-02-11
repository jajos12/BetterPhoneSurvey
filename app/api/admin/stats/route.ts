import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getDashboardStats } from '@/lib/admin-stats';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'parent' | 'school_admin' | 'all' || 'parent';

  try {
    const stats = await getDashboardStats(type);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
