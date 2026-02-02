import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return new NextResponse('Authentication required', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            });
        }

        const [scheme, encoded] = authHeader.split(' ');

        if (scheme !== 'Basic' || !encoded) {
            return new NextResponse('Invalid authentication', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            });
        }

        const decoded = atob(encoded);
        const [username, password] = decoded.split(':');

        // Check credentials against environment variables
        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'betterphone2024';

        if (username !== validUsername || password !== validPassword) {
            return new NextResponse('Invalid credentials', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
