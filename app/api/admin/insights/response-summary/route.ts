import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { sessionId, forceRefresh } = await request.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    // Check cache
    const { data: response } = await supabaseAdmin
      .from('survey_responses')
      .select('id, form_data, ai_summary, ai_summary_generated_at')
      .eq('session_id', sessionId)
      .single();

    if (!response) return NextResponse.json({ error: 'Response not found' }, { status: 404 });

    // Return cached if valid (24h)
    if (!forceRefresh && response.ai_summary && response.ai_summary_generated_at) {
      const generatedAt = new Date(response.ai_summary_generated_at);
      const hoursSince = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return NextResponse.json({ summary: response.ai_summary, cached: true });
      }
    }

    // Fetch transcripts
    const { data: recordings } = await supabaseAdmin
      .from('voice_recordings')
      .select('step_number, transcript, extracted_data')
      .eq('session_id', sessionId)
      .eq('processing_status', 'completed');

    const formData = response.form_data || {};
    const transcripts = (recordings || [])
      .filter(r => r.transcript)
      .map(r => `Step ${r.step_number}: ${r.transcript}`)
      .join('\n\n');

    // Build context for GPT
    const context = [
      `Pain Check: ${formData.painCheck || 'N/A'}`,
      `Issues: ${(formData.issues || []).join(', ') || 'N/A'}`,
      `Benefits Wanted: ${(formData.benefits || []).join(', ') || 'N/A'}`,
      `Price Willingness: ${(formData.priceWillingness || []).join(', ') || 'N/A'}`,
      `Email: ${formData.email || 'N/A'}`,
      transcripts ? `\nVoice Transcripts:\n${transcripts}` : '',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are analyzing a parent survey response about children\'s phone usage for BetterPhone. Return ONLY valid JSON matching the exact schema provided.'
        },
        {
          role: 'user',
          content: `Analyze this survey response and return JSON with these fields:
{
  "summary": "1-2 paragraph summary of this parent's situation, concerns, and needs",
  "urgencyScore": <1-10 number, how urgently they need a solution>,
  "emotionalTone": "<one of: frustrated, worried, hopeful, resigned, angry, overwhelmed, calm>",
  "primaryConcerns": ["<top 3-5 specific concerns>"],
  "productFitScore": <1-10 number, how good a fit BetterPhone would be for them>
}

Survey Data:
${context}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const aiSummary = JSON.parse(completion.choices[0].message.content || '{}');
    aiSummary.generatedAt = new Date().toISOString();

    // Save to database with error handling
    console.log('[AI Summary] Attempting to save for response ID:', response.id);
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('survey_responses')
      .update({
        ai_summary: aiSummary,
        ai_summary_generated_at: aiSummary.generatedAt,
      })
      .eq('id', response.id)
      .select(); // Return the updated row to verify

    if (updateError) {
      console.error('[AI Summary] Database update failed:', updateError);
      throw new Error(`Failed to save AI summary: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.error('[AI Summary] Update returned no data. Response ID might not exist.');
      throw new Error('Failed to update response - no rows affected');
    }

    console.log('[AI Summary] Successfully saved to database:', updateData[0].id);

    return NextResponse.json({ summary: aiSummary, cached: false });
  } catch (error) {
    console.error('Response summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
