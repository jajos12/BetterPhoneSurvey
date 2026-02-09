import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Check admin authentication for API routes.
 * The middleware skips /api/* routes, so each admin API route must verify auth itself.
 * Returns null if authenticated, or a 401 NextResponse if not.
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_auth');

  if (authCookie?.value !== 'authenticated') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Alternative check using the request object directly (for cases where cookies() isn't available).
 */
export function requireAdminAuthFromRequest(request: NextRequest): NextResponse | null {
  const authCookie = request.cookies.get('admin_auth');

  if (authCookie?.value !== 'authenticated') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}
