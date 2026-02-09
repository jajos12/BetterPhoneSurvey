import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdminAuthFromRequest } from '@/lib/admin-auth';
import type { ComparisonData } from '@/types/admin';

export async function POST(request: NextRequest) {
  const authError = requireAdminAuthFromRequest(request);
  if (authError) return authError;

  try {
    const { sessionIds } = await request.json();

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length < 2 || sessionIds.length > 3) {
      return NextResponse.json({ error: 'Provide 2-3 session IDs' }, { status: 400 });
    }

    // Fetch all responses in parallel
    const results = await Promise.all(
      sessionIds.map(async (sessionId: string) => {
        const [responseResult, recordingsResult] = await Promise.all([
          supabaseAdmin
            .from('survey_responses')
            .select('*')
            .eq('session_id', sessionId)
            .single(),
          supabaseAdmin
            .from('voice_recordings')
            .select('step_number, transcript')
            .eq('session_id', sessionId)
            .eq('processing_status', 'completed')
            .order('step_number'),
        ]);

        const response = responseResult.data;
        if (!response) return null;

        const formData = response.form_data || {};

        const comparison: ComparisonData = {
          sessionId: response.session_id,
          email: response.email || formData.email || 'Anonymous',
          isCompleted: response.is_completed,
          painCheck: formData.painCheck || null,
          issues: formData.issues || [],
          ranking: formData.ranking || [],
          benefits: formData.benefits || [],
          transcripts: (recordingsResult.data || [])
            .filter(r => r.transcript)
            .map(r => ({ stepNumber: r.step_number, transcript: r.transcript })),
          aiSummary: response.ai_summary || null,
          formData: {
            kidAges: formData.kidAges,
            kidsWithPhones: formData.kidsWithPhones,
            currentDevice: formData.currentDevice,
            deviceDuration: formData.deviceDuration,
            priceWillingness: formData.priceWillingness,
            step1Text: formData.step1Text,
            step4Text: formData.step4Text,
            step5Text: formData.step5Text,
            step6Text: formData.step6Text,
          },
        };

        return comparison;
      })
    );

    const validResults = results.filter(Boolean);

    if (validResults.length < 2) {
      return NextResponse.json({ error: 'Could not find enough valid responses' }, { status: 404 });
    }

    return NextResponse.json({ data: validResults });
  } catch (error) {
    console.error('[Compare API] error:', error);
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
  }
}
