import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  DEFAULT_ADMIN_SURVEY_VIEW,
  getAdminSurveyViewLabel,
  matchesAdminSurveyView,
  normalizeAdminSurveyView,
} from '@/lib/admin-survey-utils';
import { requireAdminAuth, requireAdminAuthFromRequest } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { AdminSurveyView } from '@/types/admin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dynamic = 'force-dynamic';

type InsightResponseRow = {
  session_id: string;
  form_data: InsightFormData | null;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
  email: string | null;
  current_step: string | null;
  survey_type: string | null;
};

type InsightFormData = {
  surveyVariant?: string;
  painCheck?: string;
  issues?: string[];
  benefits?: string[];
  ranking?: string[];
  priceWillingness?: string[];
  emailOptIn?: boolean;
  kidsWithPhones?: string;
  step1Text?: string;
  step2Text?: string;
  step4Text?: string;
  step5Text?: string;
  step6Text?: string;
  step7Text?: string;
  step9Text?: string;
  step11Text?: string;
  step12Text?: string;
  step13Text?: string;
  step16Text?: string;
  schoolIssues?: string[];
  solutionsTried?: string[];
  solutionEffectiveness?: Record<string, string>;
  budgetRange?: string;
  schoolType?: string;
};

type InsightRecordingRow = {
  transcript: string | null;
  extracted_data: Record<string, unknown> | null;
  step_number: number;
  duration: number | null;
  session_id: string;
};

function getSurveyView(request: NextRequest | Request): AdminSurveyView {
  const { searchParams } = new URL(request.url);
  const requestedView = normalizeAdminSurveyView(searchParams.get('type'));
  return requestedView === 'all' ? DEFAULT_ADMIN_SURVEY_VIEW : requestedView;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchResponsesForView(surveyView: AdminSurveyView): Promise<InsightResponseRow[]> {
  let query = supabaseAdmin
    .from('survey_responses')
    .select('session_id, form_data, is_completed, started_at, completed_at, email, current_step, survey_type');

  if (surveyView === 'school_admin') {
    query = query.eq('survey_type', 'school_admin');
  } else {
    query = query.or('survey_type.eq.parent,survey_type.is.null');
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return ((data || []) as InsightResponseRow[]).filter((response) => matchesAdminSurveyView(response, surveyView));
}

async function fetchRecordingsForSessions(sessionIds: string[]): Promise<InsightRecordingRow[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const recordingChunks = await Promise.all(
    chunkArray(sessionIds, 200).map(async (chunk) => {
      const { data, error } = await supabaseAdmin
        .from('voice_recordings')
        .select('transcript, extracted_data, step_number, duration, session_id')
        .eq('processing_status', 'completed')
        .in('session_id', chunk);

      if (error) {
        throw error;
      }

      return (data || []) as InsightRecordingRow[];
    })
  );

  return recordingChunks.flat();
}

function formatFrequencyMap(entries: Record<string, number>, limit: number): string {
  const sorted = Object.entries(entries).sort((left, right) => right[1] - left[1]);
  if (sorted.length === 0) {
    return 'None recorded';
  }

  return sorted
    .slice(0, limit)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

function summarizeUrgency(recordings: InsightRecordingRow[]) {
  const urgencyLevels: number[] = [];
  let totalVoiceDuration = 0;
  const transcriptSamples: string[] = [];

  for (const recording of recordings) {
    totalVoiceDuration += recording.duration || 0;

    const data = recording.extracted_data;
    if (data) {
      const level = (data.urgency_level as number) || (data.emotional_intensity as number);
      if (typeof level === 'number') {
        urgencyLevels.push(level);
      }
    }

    if (recording.transcript && transcriptSamples.length < 30) {
      transcriptSamples.push(`[Step ${recording.step_number}] ${recording.transcript.slice(0, 200)}`);
    }
  }

  const avgUrgency =
    urgencyLevels.length > 0
      ? (urgencyLevels.reduce((sum, value) => sum + value, 0) / urgencyLevels.length).toFixed(1)
      : 'N/A';

  return {
    avgUrgency,
    transcriptSamples,
    totalVoiceDuration,
    urgencyLevels,
  };
}

function collectTextResponses(
  responses: InsightResponseRow[],
  fieldNames: string[],
  limit = 50
): string[] {
  const textResponses: string[] = [];

  for (const response of responses) {
    const formData = response.form_data || {};
    const texts = fieldNames.map((fieldName) => formData[fieldName]).filter(Boolean);
    if (texts.length > 0 && textResponses.length < limit) {
      textResponses.push(texts.join(' | '));
    }
  }

  return textResponses;
}

function buildCondensedParentContext(
  responses: InsightResponseRow[],
  recordings: InsightRecordingRow[]
) {
  const issueFrequency: Record<string, number> = {};
  const firstPriorityFrequency: Record<string, number> = {};
  const priceFrequency: Record<string, number> = {};
  const kidsFrequency: Record<string, number> = {};
  let completedCount = 0;
  let emailOptInCount = 0;

  for (const response of responses) {
    if (response.is_completed) completedCount += 1;

    const formData = response.form_data || {};
    for (const issue of formData.issues || []) {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    }

    const topIssue = formData.ranking?.[0] || formData.issues?.[0];
    if (topIssue) {
      firstPriorityFrequency[topIssue] = (firstPriorityFrequency[topIssue] || 0) + 1;
    }

    for (const price of formData.priceWillingness || []) {
      priceFrequency[price] = (priceFrequency[price] || 0) + 1;
    }

    if (formData.kidsWithPhones) {
      kidsFrequency[formData.kidsWithPhones] = (kidsFrequency[formData.kidsWithPhones] || 0) + 1;
    }

    if (formData.emailOptIn) {
      emailOptInCount += 1;
    }
  }

  const textResponses = collectTextResponses(responses, ['step1Text']);
  const { avgUrgency, transcriptSamples, totalVoiceDuration, urgencyLevels } = summarizeUrgency(recordings);
  const optInRate = responses.length > 0 ? Math.round((emailOptInCount / responses.length) * 100) : 0;

  const context = `
AGGREGATE CONDENSED PARENT DATA (${responses.length} responses, ${completedCount} completed):

Top Issues: ${formatFrequencyMap(issueFrequency, 12)}

Top First-Priority Issues: ${formatFrequencyMap(firstPriorityFrequency, 8)}

Kids Affected: ${JSON.stringify(kidsFrequency)}

Price Willingness: ${JSON.stringify(priceFrequency)}

Email Opt-In Rate: ${optInRate}%

Average Urgency/Intensity: ${avgUrgency} (from ${urgencyLevels.length} recordings)

Sample Parent Narratives:
${textResponses.slice(0, 20).map((text, index) => `${index + 1}. ${text.slice(0, 320)}`).join('\n')}

Sample Voice Transcripts:
${transcriptSamples.slice(0, 15).join('\n')}
`.trim();

  return {
    context,
    completedCount,
    totalVoiceDuration,
  };
}

function buildLongFormParentContext(
  responses: InsightResponseRow[],
  recordings: InsightRecordingRow[]
) {
  const painCheckDistribution: Record<string, number> = {};
  const issueFrequency: Record<string, number> = {};
  const benefitFrequency: Record<string, number> = {};
  const priceFrequency: Record<string, number> = {};
  let completedCount = 0;

  for (const response of responses) {
    if (response.is_completed) completedCount += 1;

    const formData = response.form_data || {};
    if (formData.painCheck) {
      painCheckDistribution[formData.painCheck] = (painCheckDistribution[formData.painCheck] || 0) + 1;
    }

    for (const issue of formData.issues || []) {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    }

    for (const benefit of formData.benefits || []) {
      benefitFrequency[benefit] = (benefitFrequency[benefit] || 0) + 1;
    }

    for (const price of formData.priceWillingness || []) {
      priceFrequency[price] = (priceFrequency[price] || 0) + 1;
    }
  }

  const textResponses = collectTextResponses(responses, [
    'step1Text',
    'step4Text',
    'step5Text',
    'step6Text',
    'step11Text',
    'step12Text',
  ]);
  const { avgUrgency, transcriptSamples, totalVoiceDuration } = summarizeUrgency(recordings);

  const context = `
AGGREGATE LONG-FORM PARENT DATA (${responses.length} responses, ${completedCount} completed):
Pain Check: ${JSON.stringify(painCheckDistribution)}
Top Issues: ${formatFrequencyMap(issueFrequency, 15)}
Top Benefits: ${formatFrequencyMap(benefitFrequency, 10)}
Price Willingness: ${JSON.stringify(priceFrequency)}
Average Urgency: ${avgUrgency}
Sample Texts:
${textResponses.slice(0, 20).map((text, index) => `${index + 1}. ${text.slice(0, 300)}`).join('\n')}
Sample Transcripts:
${transcriptSamples.slice(0, 15).join('\n')}
`.trim();

  return {
    context,
    completedCount,
    totalVoiceDuration,
  };
}

function buildSchoolAdminContext(
  responses: InsightResponseRow[],
  recordings: InsightRecordingRow[]
) {
  const issueFrequency: Record<string, number> = {};
  const solutionFrequency: Record<string, number> = {};
  const effectivenessFrequency: Record<string, Record<string, number>> = {};
  const budgetFrequency: Record<string, number> = {};
  const schoolTypeFrequency: Record<string, number> = {};
  let completedCount = 0;

  for (const response of responses) {
    if (response.is_completed) completedCount += 1;

    const formData = response.form_data || {};

    for (const issue of formData.schoolIssues || []) {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    }

    for (const solution of formData.solutionsTried || []) {
      solutionFrequency[solution] = (solutionFrequency[solution] || 0) + 1;
    }

    if (formData.solutionEffectiveness) {
      for (const [solution, effectiveness] of Object.entries(formData.solutionEffectiveness as Record<string, string>)) {
        if (!effectivenessFrequency[solution]) {
          effectivenessFrequency[solution] = {};
        }

        effectivenessFrequency[solution][effectiveness] =
          (effectivenessFrequency[solution][effectiveness] || 0) + 1;
      }
    }

    if (formData.budgetRange) {
      budgetFrequency[formData.budgetRange] = (budgetFrequency[formData.budgetRange] || 0) + 1;
    }

    if (formData.schoolType) {
      schoolTypeFrequency[formData.schoolType] = (schoolTypeFrequency[formData.schoolType] || 0) + 1;
    }
  }

  const textResponses = collectTextResponses(responses, ['step1Text', 'step2Text', 'step7Text', 'step13Text', 'step16Text']);
  const { avgUrgency, transcriptSamples, totalVoiceDuration, urgencyLevels } = summarizeUrgency(recordings);

  const context = `
AGGREGATE SCHOOL ADMIN DATA (${responses.length} responses, ${completedCount} completed):

Top School Issues: ${formatFrequencyMap(issueFrequency, 15)}

Solutions Tried: ${formatFrequencyMap(solutionFrequency, 10)}

Budget Ranges: ${JSON.stringify(budgetFrequency)}

School Types: ${JSON.stringify(schoolTypeFrequency)}

Solution Effectiveness: ${JSON.stringify(effectivenessFrequency)}

Average Urgency/Intensity: ${avgUrgency} (from ${urgencyLevels.length} recordings)

Sample Text Insights (Challenges, Barriers, Decisions):
${textResponses.slice(0, 20).map((text, index) => `${index + 1}. ${text.slice(0, 300)}`).join('\n')}

Sample Voice Transcripts:
${transcriptSamples.slice(0, 15).join('\n')}
`.trim();

  return {
    context,
    completedCount,
    totalVoiceDuration,
  };
}

function buildPromptContext(
  surveyView: AdminSurveyView,
  responses: InsightResponseRow[],
  recordings: InsightRecordingRow[]
) {
  switch (surveyView) {
    case 'school_admin':
      return {
        ...buildSchoolAdminContext(responses, recordings),
        systemPrompt:
          'You are a research analyst reviewing school administrator survey data about student smartphone disruption, policy friction, and pilot readiness.',
      };
    case 'parent_long':
      return {
        ...buildLongFormParentContext(responses, recordings),
        systemPrompt:
          "You are a product research analyst reviewing BetterPhone's long-form parent survey data about children's phone usage, parent pain, and desired benefits.",
      };
    case 'parent_condensed':
    default:
      return {
        ...buildCondensedParentContext(responses, recordings),
        systemPrompt:
          "You are a product research analyst reviewing BetterPhone's condensed parent survey data about kid screen struggles, urgency, and purchase intent.",
      };
  }
}

// GET: Fetch cached insights
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  const surveyView = getSurveyView(request);
  const cacheKey = `global_insights_${surveyView}`;

  try {
    const { data: cached } = await supabaseAdmin
      .from('ai_insights_cache')
      .select('*')
      .eq('insight_type', cacheKey)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    const responses = await fetchResponsesForView(surveyView);
    const responseCount = responses.length;

    const isExpired = cached && new Date(cached.expires_at) < new Date();
    const isCountMismatch = cached && cached.response_count !== responseCount;

    if (cached && !isExpired && !isCountMismatch) {
      return NextResponse.json({
        insights: cached.data,
        generatedAt: cached.generated_at,
        cached: true,
        responseCount,
        surveyLabel: getAdminSurveyViewLabel(surveyView),
      });
    }

    if (cached) {
      return NextResponse.json({
        insights: cached.data,
        generatedAt: cached.generated_at,
        cached: true,
        stale: true,
        responseCount,
        surveyLabel: getAdminSurveyViewLabel(surveyView),
      });
    }

    return NextResponse.json({
      insights: null,
      responseCount,
      surveyLabel: getAdminSurveyViewLabel(surveyView),
    });
  } catch (error) {
    console.error('[Insights GET] error:', error);
    return NextResponse.json({ insights: null, responseCount: 0 });
  }
}

// POST: Generate fresh insights
export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  const surveyView = getSurveyView(request);
  const cacheKey = `global_insights_${surveyView}`;

  try {
    const responses = await fetchResponsesForView(surveyView);
    if (responses.length === 0) {
      return NextResponse.json({ error: 'No responses to analyze' }, { status: 400 });
    }

    const recordings = await fetchRecordingsForSessions(responses.map((response) => response.session_id));
    const { context, completedCount, systemPrompt, totalVoiceDuration } = buildPromptContext(
      surveyView,
      responses,
      recordings
    );

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

    const { error: cacheError } = await supabaseAdmin
      .from('ai_insights_cache')
      .upsert(
        {
          insight_type: cacheKey,
          data: insights,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          response_count: responses.length,
        },
        { onConflict: 'insight_type' }
      )
      .select();

    if (cacheError) {
      console.error('[Global Insights] Cache failed:', cacheError);
      return NextResponse.json({
        insights,
        cached: false,
        responseCount: responses.length,
        surveyLabel: getAdminSurveyViewLabel(surveyView),
        cacheWarning: cacheError.message,
      });
    }

    return NextResponse.json({
      insights,
      cached: false,
      responseCount: responses.length,
      surveyLabel: getAdminSurveyViewLabel(surveyView),
    });
  } catch (error) {
    console.error('[Insights POST] error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
