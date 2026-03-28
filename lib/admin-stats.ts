import { format, startOfDay, subDays } from 'date-fns';
import { FUNNEL_COLORS } from '@/lib/chart-theme';
import {
  DEFAULT_ADMIN_SURVEY_VIEW,
  getAdminSurveyViewDescription,
  getAdminSurveyViewFromResponse,
  getAdminSurveyViewLabel,
  getDefaultStepIdForSurveyView,
  getVisibleStepsForSurveyView,
  matchesAdminSurveyView,
} from '@/lib/admin-survey-utils';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { AdminSurveyView, DashboardStats, FunnelStep, StepDuration, UrgencyDistribution } from '@/types/admin';

type ResponseRow = {
  session_id: string;
  email: string | null;
  current_step: string | null;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  form_data: Record<string, unknown> | null;
  survey_type: string | null;
};

type RecordingRow = {
  extracted_data: Record<string, unknown> | null;
  session_id: string;
  duration: number | null;
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchResponsesForView(surveyView: AdminSurveyView): Promise<ResponseRow[]> {
  let query = supabaseAdmin
    .from('survey_responses')
    .select('session_id, email, current_step, started_at, completed_at, is_completed, form_data, survey_type');

  if (surveyView === 'school_admin') {
    query = query.eq('survey_type', 'school_admin');
  } else if (surveyView !== 'all') {
    query = query.or('survey_type.eq.parent,survey_type.is.null');
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return ((data || []) as ResponseRow[]).filter((response) => matchesAdminSurveyView(response, surveyView));
}

async function fetchCompletedRecordings(sessionIds: string[]): Promise<RecordingRow[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const recordingChunks = await Promise.all(
    chunkArray(sessionIds, 200).map(async (chunk) => {
      const { data, error } = await supabaseAdmin
        .from('voice_recordings')
        .select('extracted_data, session_id, duration')
        .eq('processing_status', 'completed')
        .in('session_id', chunk);

      if (error) {
        throw error;
      }

      return (data || []) as RecordingRow[];
    })
  );

  return recordingChunks.flat();
}

function buildFunnel(responses: ResponseRow[], surveyView: AdminSurveyView): FunnelStep[] {
  if (surveyView === 'all') {
    return [];
  }

  const surveySteps = getVisibleStepsForSurveyView(surveyView);
  const defaultStart = getDefaultStepIdForSurveyView(surveyView);
  const stepCounts = new Map<string, number>(surveySteps.map((step) => [step.id, 0]));

  for (const response of responses) {
    if (response.is_completed || response.current_step === 'thank-you') {
      for (const step of surveySteps) {
        stepCounts.set(step.id, (stepCounts.get(step.id) || 0) + 1);
      }
      continue;
    }

    const currentStep =
      response.current_step && response.current_step !== 'unknown' && response.current_step !== 'intro'
        ? response.current_step
        : defaultStart;
    const currentIndex = surveySteps.findIndex((step) => step.id === currentStep);

    if (currentIndex === -1) {
      continue;
    }

    for (let index = 0; index <= currentIndex; index += 1) {
      const stepId = surveySteps[index].id;
      stepCounts.set(stepId, (stepCounts.get(stepId) || 0) + 1);
    }
  }

  return surveySteps.map((step, index) => ({
    step: step.title.length > 32 ? `${step.title.slice(0, 32)}...` : step.title,
    stepId: step.id,
    count: stepCounts.get(step.id) || 0,
    color: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
  }));
}

function buildStepDurations(funnel: FunnelStep[]): StepDuration[] {
  return funnel.map((step, index) => {
    const reachedCount = step.count;
    const nextCount = funnel[index + 1]?.count ?? 0;
    const dropOff = reachedCount > 0 ? Math.round(((reachedCount - nextCount) / reachedCount) * 100) : 0;

    return {
      stepId: step.stepId,
      stepName: step.step.length > 24 ? `${step.step.slice(0, 24)}...` : step.step,
      avgDurationSeconds: 0,
      dropOffPct: Math.max(0, dropOff),
    };
  });
}

function buildUrgency(recordings: RecordingRow[]): UrgencyDistribution {
  const urgency: UrgencyDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    dominant: 'low',
    dominantPct: 0,
  };

  let urgencyTotal = 0;
  for (const recording of recordings) {
    const data = recording.extracted_data;
    if (!data) {
      continue;
    }

    const level = (data.urgency_level as number) || (data.emotional_intensity as number);
    if (typeof level !== 'number') {
      continue;
    }

    urgencyTotal += 1;
    if (level >= 9) urgency.critical += 1;
    else if (level >= 7) urgency.high += 1;
    else if (level >= 4) urgency.medium += 1;
    else urgency.low += 1;
  }

  if (urgencyTotal > 0) {
    const [dominant, dominantCount] = Object.entries({
      low: urgency.low,
      medium: urgency.medium,
      high: urgency.high,
      critical: urgency.critical,
    }).reduce((currentMax, next) => (next[1] > currentMax[1] ? next : currentMax));

    urgency.dominant = dominant;
    urgency.dominantPct = Math.round((dominantCount / urgencyTotal) * 100);
  }

  return urgency;
}

export async function getDashboardStats(
  surveyView: AdminSurveyView = DEFAULT_ADMIN_SURVEY_VIEW
): Promise<DashboardStats> {
  try {
    const responses = await fetchResponsesForView(surveyView);
    const totalResponses = responses.length;
    const completedResponses = responses.filter((response) => response.is_completed).length;
    const recordings = await fetchCompletedRecordings(responses.map((response) => response.session_id));
    const urgency = buildUrgency(recordings);
    const funnel = buildFunnel(responses, surveyView);
    const now = new Date();

    const daily: Array<{ date: string; started: number; completed: number }> = [];
    const completionRate: Array<{ date: string; rate: number }> = [];

    for (let index = 29; index >= 0; index -= 1) {
      const day = startOfDay(subDays(now, index));
      const dateKey = format(day, 'yyyy-MM-dd');
      const label = format(day, 'MMM dd');
      const started = responses.filter(
        (response) => format(startOfDay(new Date(response.started_at)), 'yyyy-MM-dd') === dateKey
      ).length;
      const completed = responses.filter(
        (response) =>
          !!response.completed_at &&
          format(startOfDay(new Date(response.completed_at)), 'yyyy-MM-dd') === dateKey
      ).length;

      daily.push({ date: label, started, completed });
      completionRate.push({
        date: label,
        rate: started > 0 ? Math.round((completed / started) * 100) : 0,
      });
    }

    const recentResponses = [...responses]
      .sort((left, right) => new Date(right.started_at).getTime() - new Date(left.started_at).getTime())
      .slice(0, 8)
      .map((response) => {
        const responseView = getAdminSurveyViewFromResponse(response);

        return {
          session_id: response.session_id,
          email: response.email,
          is_completed: response.is_completed,
          started_at: response.started_at,
          current_step: response.current_step || getDefaultStepIdForSurveyView(responseView),
          surveyView: responseView,
          surveyLabel: getAdminSurveyViewLabel(responseView),
        };
      });

    return {
      surveyView,
      surveyLabel: getAdminSurveyViewLabel(surveyView),
      surveyDescription: getAdminSurveyViewDescription(surveyView),
      totalResponses,
      completedResponses,
      voiceRecordings: recordings.length,
      completionRate: totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0,
      funnel,
      urgency,
      timeSeries: {
        daily,
        completionRate,
      },
      stepDurations: buildStepDurations(funnel),
      recentResponses,
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    throw error;
  }
}
