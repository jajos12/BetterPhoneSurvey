import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAdminSurveyViewFromResponse } from '@/lib/admin-survey-utils';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SummaryFormData = {
  painCheck?: string;
  issues?: string[];
  benefits?: string[];
  ranking?: string[];
  ageRanges?: string[];
  features?: string[];
  featureRanking?: string[];
  objectionText?: string;
  priceWillingness?: string[];
  emailOptIn?: boolean;
  email?: string;
  kidsWithPhones?: string;
  currentDevices?: string[];
  screenedOut?: boolean;
  screenedOutReferrals?: string[];
  thankYouReferrals?: string[];
  bonusText?: string;
  step1Text?: string;
  step2Text?: string;
  step4Text?: string;
  step5Text?: string;
  step6Text?: string;
  step7Text?: string;
  step9Text?: string;
  step13Text?: string;
  step16Text?: string;
  disruptionFrequency?: string;
  schoolIssues?: string[];
  issueRanking?: string[];
  solutionsTried?: string[];
  solutionEffectiveness?: Record<string, string>;
  schoolType?: string;
  currentPolicy?: string;
  budgetRange?: string;
  pilotInterest?: string;
  callInterest?: string;
};

function buildSummaryContext(
  surveyView: 'parent_long' | 'parent_condensed' | 'school_admin',
  formData: SummaryFormData,
  transcripts: string
) {
  if (surveyView === 'school_admin') {
    return {
      systemPrompt:
        'You are analyzing a school administrator survey response about smartphone disruption, policy enforcement, and BetterPhone fit for a campus. Return ONLY valid JSON matching the exact schema provided.',
      context: [
        `Disruption Frequency: ${formData.disruptionFrequency || 'N/A'}`,
        `School Issues: ${(formData.schoolIssues || []).join(', ') || 'N/A'}`,
        `Issue Ranking: ${(formData.issueRanking || []).join(', ') || 'N/A'}`,
        `Solutions Tried: ${(formData.solutionsTried || []).join(', ') || 'N/A'}`,
        `Solution Effectiveness: ${JSON.stringify(formData.solutionEffectiveness || {})}`,
        `School Type: ${formData.schoolType || 'N/A'}`,
        `Current Policy: ${formData.currentPolicy || 'N/A'}`,
        `Budget Range: ${formData.budgetRange || 'N/A'}`,
        `Pilot Interest: ${formData.pilotInterest || 'N/A'}`,
        `Call Interest: ${formData.callInterest || 'N/A'}`,
        `Decision Process: ${formData.step13Text || 'N/A'}`,
        `Biggest Challenge: ${formData.step2Text || 'N/A'}`,
        `Barriers: ${formData.step7Text || 'N/A'}`,
        `Ideal Solution: ${formData.step9Text || 'N/A'}`,
        `Anything Else: ${formData.step16Text || 'N/A'}`,
        transcripts ? `\nVoice Transcripts:\n${transcripts}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  if (surveyView === 'parent_condensed') {
    if (formData.screenedOut) {
      return {
        systemPrompt:
          'You are analyzing a screened-out BetterPhone parent survey response that ended in the referral branch. Return ONLY valid JSON matching the exact schema provided.',
        context: [
          `Qualifier Response: ${formData.painCheck || 'N/A'}`,
          `Referral Contacts: ${(formData.screenedOutReferrals || []).join(', ') || 'N/A'}`,
          `Email: ${formData.email || 'N/A'}`,
        ]
          .filter(Boolean)
          .join('\n'),
      };
    }

    return {
      systemPrompt:
        "You are analyzing a condensed BetterPhone parent survey response about a child's relationship with screens. Return ONLY valid JSON matching the exact schema provided.",
      context: [
        `Qualifier Response: ${formData.painCheck || 'N/A'}`,
        `Core Narrative: ${formData.step1Text || 'N/A'}`,
        `Issues: ${(formData.issues || []).join(', ') || 'N/A'}`,
        `Priority Ranking: ${(formData.ranking || []).join(', ') || 'N/A'}`,
        `Kids Affected: ${formData.kidsWithPhones || 'N/A'}`,
        `Age Ranges: ${(formData.ageRanges || []).join(', ') || 'N/A'}`,
        `Desired Features: ${(formData.features || []).join(', ') || 'N/A'}`,
        `Feature Ranking: ${(formData.featureRanking || []).join(', ') || 'N/A'}`,
        `Switching Barriers: ${formData.objectionText || 'N/A'}`,
        `Bonus Detail: ${formData.bonusText || 'N/A'}`,
        `Current Devices: ${(formData.currentDevices || []).join(', ') || 'N/A'}`,
        `Price Willingness: ${(formData.priceWillingness || []).join(', ') || 'N/A'}`,
        `Thank-You Referrals: ${(formData.thankYouReferrals || []).join(', ') || 'N/A'}`,
        `Email Opt-In: ${formData.emailOptIn ? 'Yes' : 'No'}`,
        `Email: ${formData.email || 'N/A'}`,
        transcripts ? `\nVoice Transcripts:\n${transcripts}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  return {
    systemPrompt:
      "You are analyzing a long-form BetterPhone parent survey response about children's phone usage. Return ONLY valid JSON matching the exact schema provided.",
    context: [
      `Pain Check: ${formData.painCheck || 'N/A'}`,
      `Issues: ${(formData.issues || []).join(', ') || 'N/A'}`,
      `Benefits Wanted: ${(formData.benefits || []).join(', ') || 'N/A'}`,
      `Price Willingness: ${(formData.priceWillingness || []).join(', ') || 'N/A'}`,
      `Email: ${formData.email || 'N/A'}`,
      `Urgency Narrative: ${formData.step4Text || 'N/A'}`,
      `Solutions Tried: ${formData.step5Text || 'N/A'}`,
      `Switching Concerns: ${formData.step6Text || 'N/A'}`,
      transcripts ? `\nVoice Transcripts:\n${transcripts}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { sessionId, forceRefresh } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const { data: response } = await supabaseAdmin
      .from('survey_responses')
      .select('id, form_data, survey_type, ai_summary, ai_summary_generated_at')
      .eq('session_id', sessionId)
      .single();

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    if (!forceRefresh && response.ai_summary && response.ai_summary_generated_at) {
      const generatedAt = new Date(response.ai_summary_generated_at);
      const hoursSince = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 24) {
        return NextResponse.json({ summary: response.ai_summary, cached: true });
      }
    }

    const { data: recordings } = await supabaseAdmin
      .from('voice_recordings')
      .select('step_number, transcript, extracted_data')
      .eq('session_id', sessionId)
      .eq('processing_status', 'completed');

    const formData = response.form_data || {};
    const transcripts = (recordings || [])
      .filter((recording) => recording.transcript)
      .map((recording) => `Step ${recording.step_number}: ${recording.transcript}`)
      .join('\n\n');

    const surveyView = getAdminSurveyViewFromResponse(response);
    const { context, systemPrompt } = buildSummaryContext(surveyView, formData, transcripts);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this survey response and return JSON with these fields:
{
  "summary": "1-2 paragraph summary of this respondent's situation, concerns, and needs",
  "urgencyScore": <1-10 number, how urgently they need a solution>,
  "emotionalTone": "<one of: frustrated, worried, hopeful, resigned, angry, overwhelmed, calm>",
  "primaryConcerns": ["<top 3-5 specific concerns>"],
  "productFitScore": <1-10 number, how good a fit BetterPhone would be for them>
}

Survey Data:
${context}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const aiSummary = JSON.parse(completion.choices[0].message.content || '{}');
    aiSummary.generatedAt = new Date().toISOString();

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('survey_responses')
      .update({
        ai_summary: aiSummary,
        ai_summary_generated_at: aiSummary.generatedAt,
      })
      .eq('id', response.id)
      .select();

    if (updateError) {
      console.error('[AI Summary] Database update failed:', updateError);
      throw new Error(`Failed to save AI summary: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      throw new Error('Failed to update response - no rows affected');
    }

    return NextResponse.json({ summary: aiSummary, cached: false });
  } catch (error) {
    console.error('Response summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
