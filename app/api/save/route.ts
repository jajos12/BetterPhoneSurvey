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

        // Upsert the survey response
        const { data, error } = await supabaseAdmin
            .from('survey_responses')
            .upsert({
                session_id: sessionId,
                form_data: formData,
                current_step: formData.currentStep || 'unknown',
                is_completed: formData.isCompleted || false,
                email: formData.email || null,
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
