import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuth, requireAdminAuthFromRequest } from '@/lib/admin-auth';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dynamic = 'force-dynamic';

// Helper to get survey type from request
function getSurveyType(req: NextRequest | Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  return (type === 'school_admin' ? 'school_admin' : 'parent') as 'parent' | 'school_admin';
}

// GET: Fetch cached insights
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  const surveyType = getSurveyType(request);
  const cacheKey = `global_insights_${surveyType}`;

  try {
    // Check for cached global insights that haven't expired
    const { data: cached } = await supabaseAdmin
      .from('ai_insights_cache')
      .select('*')
      .eq('insight_type', cacheKey)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    // Also get current response count to detect staleness
    const { count: currentCount } = await supabaseAdmin
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      // Filter by survey type for accurate count
      .eq('survey_type', surveyType === 'school_admin' ? 'school_admin' : 'parent');
    // Note: For parent, we might want to include nulls if legacy data exists, 
    // but strictly 'parent' is safer if we migrated correctly. 
    // If legacy data has null, use .or('survey_type.eq.parent,survey_type.is.null')

    // For safety with legacy data:
    let countQuery = supabaseAdmin
      .from('survey_responses')
      .select('*', { count: 'exact', head: true });

    if (surveyType === 'school_admin') {
      countQuery = countQuery.eq('survey_type', 'school_admin');
    } else {
      countQuery = countQuery.or('survey_type.eq.parent,survey_type.is.null');
    }

    const { count: finalCount } = await countQuery;

    const isExpired = cached && new Date(cached.expires_at) < new Date();
    const isCountMismatch = cached && cached.response_count !== finalCount;

    if (cached && !isExpired && !isCountMismatch) {
      return NextResponse.json({
        insights: cached.data,
        generatedAt: cached.generated_at,
        cached: true,
        responseCount: finalCount,
      });
    }

    // Return stale cache if exists (but flag it)
    if (cached) {
      return NextResponse.json({
        insights: cached.data,
        generatedAt: cached.generated_at,
        cached: true,
        stale: true,
        responseCount: finalCount,
      });
    }

    return NextResponse.json({ insights: null, responseCount: finalCount || 0 });
  } catch (error) {
    console.error('[Insights GET] error:', error);
    return NextResponse.json({ insights: null, responseCount: 0 });
  }
}

// POST: Generate fresh insights
export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  const surveyType = getSurveyType(request);
  const cacheKey = `global_insights_${surveyType}`;

  try {
    // 1. Fetch Responses
    let query = supabaseAdmin
      .from('survey_responses')
      .select('session_id, form_data, is_completed, started_at, completed_at, email, current_step, survey_type');

    if (surveyType === 'school_admin') {
      query = query.eq('survey_type', 'school_admin');
    } else {
      query = query.or('survey_type.eq.parent,survey_type.is.null');
    }

    const { data: responses, error: respError } = await query;
    if (respError || !responses || responses.length === 0) {
      return NextResponse.json({ error: 'No responses to analyze' }, { status: 400 });
    }

    // 2. Fetch Recordings (filtered by session_ids from responses)
    const sessionIds = responses.map(r => r.session_id);
    // Fetch in chunks if too many? For now assuming < 1000 active sessions is fine.
    const { data: recordings } = await supabaseAdmin
      .from('voice_recordings')
      .select('transcript, extracted_data, step_number, duration, session_id')
      .eq('processing_status', 'completed')
      .in('session_id', sessionIds);

    const validRecordings = recordings || [];

    // 3. Aggregate Data
    let context = '';
    let completedCount = 0;
    const urgencyLevels: number[] = [];
    const textResponses: string[] = [];
    const transcriptSamples: string[] = [];
    let totalVoiceDuration = 0;

    // Common Logic
    for (const r of responses) {
      if (r.is_completed) completedCount++;
    }

    for (const rec of validRecordings) {
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

    const avgUrgency = urgencyLevels.length > 0
      ? (urgencyLevels.reduce((a, b) => a + b, 0) / urgencyLevels.length).toFixed(1)
      : 'N/A';


    // Specific Logic
    if (surveyType === 'school_admin') {
      const issuesFreq: Record<string, number> = {};
      const solutionsFreq: Record<string, number> = {};
      const effectiveness: Record<string, Record<string, number>> = {}; // solution -> { status -> count }
      const budgetFreq: Record<string, number> = {};
      const schoolTypeFreq: Record<string, number> = {};

      for (const r of responses) {
        const fd = r.form_data || {};

        // Issues
        for (const issue of (fd.schoolIssues || [])) {
          issuesFreq[issue] = (issuesFreq[issue] || 0) + 1;
        }
        // Solutions
        for (const sol of (fd.solutionsTried || [])) {
          solutionsFreq[sol] = (solutionsFreq[sol] || 0) + 1;
        }
        // Effectiveness
        if (fd.solutionEffectiveness) {
          for (const [sol, effect] of Object.entries(fd.solutionEffectiveness as Record<string, string>)) {
            if (!effectiveness[sol]) effectiveness[sol] = {};
            effectiveness[sol][effect] = (effectiveness[sol][effect] || 0) + 1;
          }
        }
        // Budget
        if (fd.budgetRange) budgetFreq[fd.budgetRange] = (budgetFreq[fd.budgetRange] || 0) + 1;
        // School Type
        if (fd.schoolType) schoolTypeFreq[fd.schoolType] = (schoolTypeFreq[fd.schoolType] || 0) + 1;

        // Texts
        const texts = [fd.step1Text, fd.step2Text, fd.step7Text, fd.step11Text, fd.step14Text].filter(Boolean);
        if (texts.length > 0 && textResponses.length < 50) {
          textResponses.push(texts.join(' | '));
        }
      }

      const topIssues = Object.entries(issuesFreq).sort((a, b) => b[1] - a[1]);
      const topSolutions = Object.entries(solutionsFreq).sort((a, b) => b[1] - a[1]);

      context = `
AGGREGATE SCHOOL ADMIN DATA (${responses.length} responses, ${completedCount} completed):

Top School Issues: ${topIssues.slice(0, 15).map(([k, v]) => `${k}: ${v}`).join(', ')}

Solutions Tried: ${topSolutions.slice(0, 10).map(([k, v]) => `${k}: ${v}`).join(', ')}

Budget Ranges: ${JSON.stringify(budgetFreq)}

School Types: ${JSON.stringify(schoolTypeFreq)}

Average Urgency/Intensity: ${avgUrgency} (from ${urgencyLevels.length} recordings)

Sample Text Insights (Challenges, Barriers, Decisions):
${textResponses.slice(0, 20).map((t, i) => `${i + 1}. ${t.slice(0, 300)}`).join('\n')}

Sample Voice Transcripts:
${transcriptSamples.slice(0, 15).join('\n')}
`.trim();

    } else {
      // PARENT LOGIC (Existing)
      const painCheckDist: Record<string, number> = {};
      const issueFreq: Record<string, number> = {};
      const benefitFreq: Record<string, number> = {};
      const priceFreq: Record<string, number> = {};

      for (const r of responses) {
        const fd = r.form_data || {};
        if (fd.painCheck) painCheckDist[fd.painCheck] = (painCheckDist[fd.painCheck] || 0) + 1;
        for (const issue of (fd.issues || [])) issueFreq[issue] = (issueFreq[issue] || 0) + 1;
        for (const benefit of (fd.benefits || [])) benefitFreq[benefit] = (benefitFreq[benefit] || 0) + 1;
        for (const price of (fd.priceWillingness || [])) priceFreq[price] = (priceFreq[price] || 0) + 1;

        const texts = [fd.step1Text, fd.step4Text, fd.step5Text, fd.step6Text, fd.step11Text, fd.step12Text].filter(Boolean);
        if (texts.length > 0 && textResponses.length < 50) {
          textResponses.push(texts.join(' | '));
        }
      }

      const sortedIssues = Object.entries(issueFreq).sort((a, b) => b[1] - a[1]);
      const sortedBenefits = Object.entries(benefitFreq).sort((a, b) => b[1] - a[1]);

      context = `
AGGREGATE PARENT DATA (${responses.length} responses, ${completedCount} completed):
Pain Check: ${JSON.stringify(painCheckDist)}
Top Issues: ${sortedIssues.slice(0, 15).map(([k, v]) => `${k}: ${v}`).join(', ')}
Top Benefits: ${sortedBenefits.slice(0, 10).map(([k, v]) => `${k}: ${v}`).join(', ')}
Price Willingness: ${JSON.stringify(priceFreq)}
Average Urgency: ${avgUrgency}
Sample Texts:
${textResponses.slice(0, 20).map((t, i) => `${i + 1}. ${t.slice(0, 300)}`).join('\n')}
Sample Transcripts:
${transcriptSamples.slice(0, 15).join('\n')}
`.trim();
    }

    const systemPrompt = surveyType === 'school_admin'
      ? 'You are a research analyst reviewing School Administrator survey data regarding smartphone policies. Provide insights on school challenges, policy barriers, and budget/decision dynamics.'
      : 'You are a product research analyst reviewing Parent survey data about children\'s phone usage. Provide insights on parent concerns, urgency, and willingness to pay.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${systemPrompt} Return ONLY valid JSON matching the exact schema provided.`,
        },
        {
          role: 'user',
          content: `Analyze this data and return JSON with this schema:
{
  "sentiment": {
    "overall": "positive" | "negative" | "neutral",
    "distribution": { "positive": <0-100>, "negative": <0-100>, "neutral": <0-100> },
    "timeline": []
  },
  "themes": [
    { "theme": "<name>", "count": <freq>, "relatedQuotes": ["<quote1>", "<quote2>"] }
  ],
  "executiveSummary": "<2-3 paragraphs analysis>",
  "urgencyDistribution": { "low": <count>, "medium": <count>, "high": <count>, "critical": <count>, "dominant": "<level>", "dominantPct": <pct> },
  "recommendations": [
    { "recommendation": "<text>", "confidence": <0.0-1.0>, "supportingData": "<text>" }
  ],
  "keyMetrics": {
    "avgUrgency": <1-10>,
    "topConcern": "<text>",
    "avgCompletionTime": 0,
    "totalVoiceMinutes": ${Math.round(totalVoiceDuration / 60)},
    "responseRate": ${responses.length > 0 ? Math.round((completedCount / responses.length) * 100) : 0}
  }
}

Data:
${context}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const insights = JSON.parse(completion.choices[0].message.content || '{}');
    insights.generatedAt = new Date().toISOString();

    // Cache the results
    const { error: cacheError } = await supabaseAdmin
      .from('ai_insights_cache')
      .upsert({
        insight_type: cacheKey,
        data: insights,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        response_count: responses.length,
      }, { onConflict: 'insight_type' })
      .select();

    if (cacheError) {
      console.error('[Global Insights] Cache failed:', cacheError);
      return NextResponse.json({
        insights,
        cached: false,
        responseCount: responses.length,
        cacheWarning: cacheError.message
      });
    }

    return NextResponse.json({ insights, cached: false, responseCount: responses.length });

  } catch (error) {
    console.error('[Insights POST] error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
