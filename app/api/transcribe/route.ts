import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const { recordingId } = await request.json();

        if (!recordingId) {
            return NextResponse.json(
                { error: 'Missing recordingId' },
                { status: 400 }
            );
        }

        // Get recording from database
        const { data: recording, error: fetchError } = await supabaseAdmin
            .from('voice_recordings')
            .select('file_url, step_number')
            .eq('id', recordingId)
            .single();

        if (fetchError || !recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        // Update status to processing
        await supabaseAdmin
            .from('voice_recordings')
            .update({ processing_status: 'processing' })
            .eq('id', recordingId);

        // Download audio file
        const audioResponse = await fetch(recording.file_url);
        const audioBlob = await audioResponse.blob();

        // Call OpenAI Whisper API
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: formData,
        });

        if (!whisperResponse.ok) {
            const error = await whisperResponse.text();
            throw new Error(`Whisper API error: ${error}`);
        }

        const { text: transcript } = await whisperResponse.json();

        // Save transcript to database
        const { error: updateError } = await supabaseAdmin
            .from('voice_recordings')
            .update({
                transcript,
                processing_status: 'completed',
                processed_at: new Date().toISOString(),
            })
            .eq('id', recordingId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            transcript,
        });

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Transcription failed' },
            { status: 500 }
        );
    }
}
