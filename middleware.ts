import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const authCookie = request.cookies.get('admin_auth');
    const isAuthenticated = authCookie?.value === 'authenticated';

    // Skip API routes
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // If on login page and already authenticated, redirect to admin
    if (pathname === '/login' && isAuthenticated) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Protect /admin routes
    if (pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/login'],
};
