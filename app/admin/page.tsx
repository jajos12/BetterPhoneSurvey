import { supabaseAdmin } from '@/lib/supabase-server';
import { STEPS } from '@/config/steps';
import { FUNNEL_COLORS } from '@/lib/chart-theme';
import { format, subDays, startOfDay } from 'date-fns';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';
import type { DashboardStats, FunnelStep, UrgencyDistribution, StepDuration } from '@/types/admin';

export const revalidate = 0;

async function getStats(): Promise<DashboardStats> {
    try {
        const [
            totalResult,
            completedResult,
            voiceResult,
            allResponses,
            voiceRecordings,
            recentResult,
        ] = await Promise.all([
            supabaseAdmin.from('survey_responses').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('survey_responses').select('*', { count: 'exact', head: true }).eq('is_completed', true),
            supabaseAdmin.from('voice_recordings').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('survey_responses').select('current_step, started_at, completed_at, is_completed, form_data'),
            supabaseAdmin.from('voice_recordings').select('extracted_data, session_id, duration').eq('processing_status', 'completed'),
            supabaseAdmin.from('survey_responses').select('session_id, email, is_completed, started_at, current_step').order('started_at', { ascending: false }).limit(8),
        ]);

        const totalResponses = totalResult.count || 0;
        const completedResponses = completedResult.count || 0;
        const voiceCount = voiceResult.count || 0;
        const responses = allResponses.data || [];
        const recordings = voiceRecordings.data || [];

        // Build real funnel
        const surveySteps = STEPS.filter(s => s.id !== 'thank-you');
        const stepCounts = new Map<string, number>();
        for (const step of surveySteps) stepCounts.set(step.id, 0);

        for (const r of responses) {
            const currentStep = r.current_step || 'pain-check';
            const currentIdx = surveySteps.findIndex(s => s.id === currentStep);
            for (let i = 0; i <= Math.max(currentIdx, 0); i++) {
                const stepId = surveySteps[i].id;
                stepCounts.set(stepId, (stepCounts.get(stepId) || 0) + 1);
            }
        }

        const funnel: FunnelStep[] = surveySteps.map((step, i) => ({
            step: step.title.length > 25 ? step.title.substring(0, 25) + '...' : step.title,
            stepId: step.id,
            count: stepCounts.get(step.id) || 0,
            color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
        }));

        // Real urgency distribution
        const urgency: UrgencyDistribution = { low: 0, medium: 0, high: 0, critical: 0, dominant: 'low', dominantPct: 0 };
        let urgencyTotal = 0;
        for (const rec of recordings) {
            const data = rec.extracted_data as Record<string, unknown> | null;
            if (!data) continue;
            const level = (data.urgency_level as number) || (data.emotional_intensity as number);
            if (typeof level !== 'number') continue;
            urgencyTotal++;
            if (level >= 9) urgency.critical++;
            else if (level >= 7) urgency.high++;
            else if (level >= 4) urgency.medium++;
            else urgency.low++;
        }
        if (urgencyTotal > 0) {
            const entries = Object.entries({ low: urgency.low, medium: urgency.medium, high: urgency.high, critical: urgency.critical });
            const [dominant, dominantCount] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
            urgency.dominant = dominant;
            urgency.dominantPct = Math.round((dominantCount / urgencyTotal) * 100);
        }

        // Time series: last 30 days
        const now = new Date();
        const daily: Array<{ date: string; started: number; completed: number }> = [];
        const completionRate: Array<{ date: string; rate: number }> = [];
        for (let i = 29; i >= 0; i--) {
            const day = startOfDay(subDays(now, i));
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayLabel = format(day, 'MMM dd');
            const started = responses.filter(r => format(startOfDay(new Date(r.started_at)), 'yyyy-MM-dd') === dateStr).length;
            const completed = responses.filter(r => r.completed_at && format(startOfDay(new Date(r.completed_at)), 'yyyy-MM-dd') === dateStr).length;
            daily.push({ date: dayLabel, started, completed });
            completionRate.push({ date: dayLabel, rate: started > 0 ? Math.round((completed / started) * 100) : 0 });
        }

        // Step durations and drop-off
        const stepDurations: StepDuration[] = surveySteps.slice(0, 12).map((step, i) => {
            const reachedCount = stepCounts.get(step.id) || 0;
            const nextStep = surveySteps[i + 1];
            const nextCount = nextStep ? (stepCounts.get(nextStep.id) || 0) : completedResponses;
            const dropOff = reachedCount > 0 ? Math.round(((reachedCount - nextCount) / reachedCount) * 100) : 0;
            return {
                stepId: step.id,
                stepName: step.title.length > 20 ? step.title.substring(0, 20) + '...' : step.title,
                avgDurationSeconds: 0,
                dropOffPct: Math.max(0, dropOff),
            };
        });

        return {
            totalResponses,
            completedResponses,
            voiceRecordings: voiceCount,
            completionRate: totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0,
            funnel,
            urgency,
            timeSeries: { daily, completionRate },
            stepDurations,
            recentResponses: recentResult.data || [],
        };
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return {
            totalResponses: 0,
            completedResponses: 0,
            voiceRecordings: 0,
            completionRate: 0,
            funnel: [],
            urgency: { low: 0, medium: 0, high: 0, critical: 0, dominant: 'low', dominantPct: 0 },
            timeSeries: { daily: [], completionRate: [] },
            stepDurations: [],
            recentResponses: [],
        };
    }
}

export default async function AdminPage() {
    const stats = await getStats();
    return <DashboardClient initialStats={stats} />;
}
