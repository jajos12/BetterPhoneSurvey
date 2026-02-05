import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, ...formData } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing sessionId' },
                { status: 400 }
            );
        }

        // Capture IP for location data (Production vs Local)
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const ip = (forwarded ? forwarded.split(',')[0] : realIp) || '127.0.0.1';

        // Add IP to formData
        formData.ipAddress = ip;

        // Validate email format if provided
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmail = formData.email && emailRegex.test(formData.email) ? formData.email : null;

        // Upsert the survey response
        const { data, error } = await supabaseAdmin
            .from('survey_responses')
            .upsert({
                session_id: sessionId,
                form_data: formData,
                current_step: formData.currentStep || 'unknown',
                is_completed: formData.isCompleted || false,
                email: validEmail,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'session_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to save response' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
