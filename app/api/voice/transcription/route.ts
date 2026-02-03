import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    const recordingId = request.nextUrl.searchParams.get('recordingId');

    if (!recordingId) {
        return NextResponse.json({ error: 'Missing recordingId' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('voice_recordings')
            .select('transcript')
            .eq('id', recordingId)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ transcription: null });
        }

        return NextResponse.json({ transcription: data?.transcript || null });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ transcription: null });
    }
}
