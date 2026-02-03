import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { SYSTEM_PROMPT, STEP_PROMPTS } from '@/config/prompts';

export async function POST(request: NextRequest) {
    try {
        const { recordingId } = await request.json();

        if (!recordingId) {
            return NextResponse.json(
                { error: 'Missing recordingId' },
                { status: 400 }
            );
        }

        // Get recording with transcript from database
        const { data: recording, error: fetchError } = await supabaseAdmin
            .from('voice_recordings')
            .select('transcript, step_number, session_id')
            .eq('id', recordingId)
            .single();

        if (fetchError || !recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        if (!recording.transcript) {
            return NextResponse.json(
                { error: 'No transcript available for extraction' },
                { status: 400 }
            );
        }

        // Get step-specific prompt
        const stepPrompt = STEP_PROMPTS[recording.step_number.toString()] || '';

        // Call GPT-4o-mini for extraction
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `${stepPrompt}\n\nTranscript to analyze:\n"${recording.transcript}"`
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            }),
        });

        if (!gptResponse.ok) {
            const error = await gptResponse.text();
            throw new Error(`GPT API error: ${error}`);
        }

        const gptData = await gptResponse.json();
        const extractedData = JSON.parse(gptData.choices[0].message.content);

        // Save extracted data to database
        const { error: updateError } = await supabaseAdmin
            .from('voice_recordings')
            .update({
                extracted_data: extractedData,
                processing_status: 'completed',
            })
            .eq('id', recordingId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            extractedData,
        });

    } catch (error) {
        console.error('Extraction error:', error);
        return NextResponse.json(
            { error: 'Extraction failed' },
            { status: 500 }
        );
    }
}
