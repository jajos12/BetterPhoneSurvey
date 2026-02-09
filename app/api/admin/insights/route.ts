import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuth, requireAdminAuthFromRequest } from '@/lib/admin-auth';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dynamic = 'force-dynamic';

// GET: Fetch cached insights
export async function GET() {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    // Check for cached global insights that haven't expired
    const { data: cached } = await supabaseAdmin
      .from('ai_insights_cache')
      .select('*')
      .eq('insight_type', 'global_insights')
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    // Also get current response count to detect staleness
    const { count: currentCount } = await supabaseAdmin
      .from('survey_responses')
      .select('*', { count: 'exact', head: true });

    if (cached && cached.response_count === currentCount) {
      return NextResponse.json({
        insights: cached.data,
        generatedAt: cached.generated_at,
        cached: true,
        responseCount: currentCount,
      });
    }

    // Return stale cache if exists (but flag it)
    if (cached) {
      return NextResponse.json({
        insights: cached.data,
        generatedAt: cached.generated_at,
        cached: true,
        stale: true,
        responseCount: currentCount,
      });
    }

    return NextResponse.json({ insights: null, responseCount: currentCount || 0 });
  } catch (error) {
    console.error('[Insights GET] error:', error);
    return NextResponse.json({ insights: null, responseCount: 0 });
  }
}

// POST: Generate fresh insights
export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    // Fetch all response data
    const [responsesResult, recordingsResult] = await Promise.all([
      supabaseAdmin
        .from('survey_responses')
        .select('form_data, is_completed, started_at, completed_at, email, current_step'),
      supabaseAdmin
        .from('voice_recordings')
        .select('transcript, extracted_data, step_number, duration, session_id')
        .eq('processing_status', 'completed'),
    ]);

    const responses = responsesResult.data || [];
    const recordings = recordingsResult.data || [];

    if (responses.length === 0) {
      return NextResponse.json({ error: 'No responses to analyze' }, { status: 400 });
    }

    // Build aggregate data for the prompt
    const painCheckDist: Record<string, number> = {};
    const issueFreq: Record<string, number> = {};
    const benefitFreq: Record<string, number> = {};
    const priceFreq: Record<string, number> = {};
    let completedCount = 0;
    const urgencyLevels: number[] = [];
    const textResponses: string[] = [];

    for (const r of responses) {
      const fd = r.form_data || {};
      if (r.is_completed) completedCount++;

      // Pain check distribution
      if (fd.painCheck) {
        painCheckDist[fd.painCheck] = (painCheckDist[fd.painCheck] || 0) + 1;
      }

      // Issue frequency
      for (const issue of (fd.issues || [])) {
        issueFreq[issue] = (issueFreq[issue] || 0) + 1;
      }

      // Benefit frequency
      for (const benefit of (fd.benefits || [])) {
        benefitFreq[benefit] = (benefitFreq[benefit] || 0) + 1;
      }

      // Price willingness
      for (const price of (fd.priceWillingness || [])) {
        priceFreq[price] = (priceFreq[price] || 0) + 1;
      }

      // Collect text responses (limit to avoid token overflow)
      const texts = [fd.step1Text, fd.step4Text, fd.step5Text, fd.step6Text, fd.step11Text, fd.step12Text].filter(Boolean);
      if (texts.length > 0 && textResponses.length < 50) {
        textResponses.push(texts.join(' | '));
      }
    }

    // Extract urgency from voice recordings
    let totalVoiceDuration = 0;
    const transcriptSamples: string[] = [];

    for (const rec of recordings) {
      totalVoiceDuration += rec.duration || 0;
      const data = rec.extracted_data as Record<string, unknown> | null;
      if (data) {
        const level = (data.urgency_level as number) || (data.emotional_intensity as number);
        if (typeof level === 'number') urgencyLevels.push(level);
      }
      if (rec.transcript && transcriptSamples.length < 30) {
        transcriptSamples.push(`[Step ${rec.step_number}] ${rec.transcript.slice(0, 200)}`);
      }
    }

    // Format data for GPT
    const sortedIssues = Object.entries(issueFreq).sort((a, b) => b[1] - a[1]);
    const sortedBenefits = Object.entries(benefitFreq).sort((a, b) => b[1] - a[1]);
    const sortedPrices = Object.entries(priceFreq).sort((a, b) => b[1] - a[1]);

    const avgUrgency = urgencyLevels.length > 0
      ? (urgencyLevels.reduce((a, b) => a + b, 0) / urgencyLevels.length).toFixed(1)
      : 'N/A';

    const context = `
AGGREGATE SURVEY DATA (${responses.length} total responses, ${completedCount} completed):

Pain Check Distribution: ${JSON.stringify(painCheckDist)}

Top Issues (frequency): ${sortedIssues.slice(0, 15).map(([k, v]) => `${k}: ${v}`).join(', ')}

Top Benefits Wanted (frequency): ${sortedBenefits.slice(0, 10).map(([k, v]) => `${k}: ${v}`).join(', ')}

Price Willingness (frequency): ${sortedPrices.map(([k, v]) => `${k}: ${v}`).join(', ')}

Average Urgency from Voice Data: ${avgUrgency} (from ${urgencyLevels.length} recordings)

Voice Recording Stats: ${recordings.length} recordings, ~${Math.round(totalVoiceDuration / 60)} minutes total

Sample Text Responses (first 20):
${textResponses.slice(0, 20).map((t, i) => `${i + 1}. ${t.slice(0, 300)}`).join('\n')}

Sample Voice Transcripts (first 15):
${transcriptSamples.slice(0, 15).join('\n')}
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a product research analyst reviewing aggregate parent survey data about children\'s phone usage for BetterPhone. Provide deep analytical insights. Return ONLY valid JSON matching the exact schema provided.',
        },
        {
          role: 'user',
          content: `Analyze this aggregate survey data and return JSON with this exact schema:
{
  "sentiment": {
    "overall": "positive" | "negative" | "neutral",
    "distribution": { "positive": <number 0-100>, "negative": <number 0-100>, "neutral": <number 0-100> },
    "timeline": []
  },
  "themes": [
    { "theme": "<theme name>", "count": <estimated frequency>, "relatedQuotes": ["<quote 1>", "<quote 2>", "<quote 3>"] }
  ],
  "executiveSummary": "<2-3 paragraphs analyzing the overall findings, key patterns, and actionable takeaways>",
  "urgencyDistribution": { "low": <count>, "medium": <count>, "high": <count>, "critical": <count>, "dominant": "<level>", "dominantPct": <number> },
  "recommendations": [
    { "recommendation": "<specific actionable recommendation>", "confidence": <0.0-1.0>, "supportingData": "<brief evidence>" }
  ],
  "keyMetrics": {
    "avgUrgency": <number 1-10>,
    "topConcern": "<most common concern>",
    "avgCompletionTime": 0,
    "totalVoiceMinutes": ${Math.round(totalVoiceDuration / 60)},
    "responseRate": ${responses.length > 0 ? Math.round((completedCount / responses.length) * 100) : 0}
  }
}

Return 5-8 themes, 4-6 recommendations. Make the executive summary insightful and data-driven.

Data:
${context}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const insights = JSON.parse(completion.choices[0].message.content || '{}');
    insights.generatedAt = new Date().toISOString();

    // Cache the results (1 hour expiry) with error handling
    console.log('[Global Insights] Attempting to cache insights for', responses.length, 'responses');
    const { data: cacheData, error: cacheError } = await supabaseAdmin
      .from('ai_insights_cache')
      .upsert({
        insight_type: 'global_insights',
        data: insights,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        response_count: responses.length,
      }, { onConflict: 'insight_type' })
      .select();

    if (cacheError) {
      console.error('[Global Insights] Failed to save cache:', cacheError);
      console.error('[Global Insights] Error details:', JSON.stringify(cacheError));
      // Don't throw - return insights anyway, just warn about cache failure
      return NextResponse.json({
        insights,
        cached: false,
        responseCount: responses.length,
        cacheWarning: 'Insights generated but not cached: ' + cacheError.message
      });
    }

    console.log('[Global Insights] Successfully cached to database');

    return NextResponse.json({ insights, cached: false, responseCount: responses.length });
  } catch (error) {
    console.error('[Insights POST] error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
