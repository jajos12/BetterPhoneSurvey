
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // 1. Fetch Survey Data
        const { data: response, error: responseError } = await supabaseAdmin
            .from('survey_responses')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (responseError || !response) {
            return NextResponse.json({ error: 'Response not found' }, { status: 404 });
        }

        // 2. Fetch Voice Transcripts
        const { data: recordings, error: recordingsError } = await supabaseAdmin
            .from('voice_recordings')
            .select('step_number, transcript')
            .eq('session_id', sessionId)
            .order('step_number');

        // Compile context
        const context = {
            formData: response.form_data,
            transcripts: recordings?.map(r => `Step ${r.step_number}: ${r.transcript || '(No transcript)'}`).join('\n')
        };

        // 3. Generate Profile with OpenAI
        const prompt = `
            Analyze this parent's survey response regarding their child's phone usage.
            
            SURVEY DATA:
            ${JSON.stringify(context.formData, null, 2)}
            
            VOICE TRANSCRIPTS:
            ${context.transcripts || "No voice recordings found."}
            
            Generate a JSON psychological profile with the following fields:
            - emotional_state: (String) e.g., "Desperate", "Anxious", "Resigned"
            - sales_angle: (String) The best approach to sell a solution (e.g., "Focus on Safety")
            - summary: (String) A 2-sentence summary of their situation.
            - urgency_score: (Number 1-10)
            - key_pain_points: (Array of Strings)
            
            Return ONLY valid JSON.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are an expert behavioral psychologist and sales profiler." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const aiProfile = JSON.parse(completion.choices[0].message.content || '{}');

        // 4. Persist to Supabase
        const { error: updateError } = await supabaseAdmin
            .from('survey_responses')
            .update({
                ai_summary: aiProfile,
                ai_summary_generated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, profile: aiProfile });

    } catch (error: any) {
        console.error('AI Profile Generation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
