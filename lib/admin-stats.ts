import { supabaseAdmin } from '@/lib/supabase-server';
import { STEPS } from '@/config/steps';
import { ADMIN_STEPS } from '@/config/school-admin-steps'; // You'll need to export this from config
import { FUNNEL_COLORS } from '@/lib/chart-theme';
import { format, subDays, startOfDay } from 'date-fns';
import type { DashboardStats, FunnelStep, UrgencyDistribution, StepDuration } from '@/types/admin';

export async function getDashboardStats(surveyType: 'parent' | 'school_admin' | 'all' = 'parent'): Promise<DashboardStats> {
    try {
        // 1. Determine which steps config to use
        // If 'all', we probably can't do a meaningful funnel unless we combine them or pick one.
        // For now, if 'all', we might just default to Parent funnel or hide it.
        // Let's stick to specific types for the funnel.

        let stepsConfig = STEPS;
        if (surveyType === 'school_admin') {
            stepsConfig = ADMIN_STEPS;
        }

        // 2. Build Query Filters
        // Helper to apply survey_type filter
        const applyFilter = (query: any) => {
            if (surveyType === 'school_admin') {
                return query.eq('survey_type', 'school_admin');
            } else if (surveyType === 'parent') {
                // Parents are NULL (legacy) or 'parent'
                return query.or('survey_type.eq.parent,survey_type.is.null');
            }
            return query; // 'all' - no filter
        };

        // 3. Execute Queries
        const [
            totalResult,
            completedResult,
            voiceResult,
            allResponsesResult,
            voiceRecordingsResult,
            recentResult,
        ] = await Promise.all([
            applyFilter(supabaseAdmin.from('survey_responses').select('*', { count: 'exact', head: true })),
            applyFilter(supabaseAdmin.from('survey_responses').select('*', { count: 'exact', head: true }).eq('is_completed', true)),
            // Voice recordings don't have survey_type directly, but they are linked to sessions. 
            // We might need to join or just fetch all for now if performance allows, or rely on the response data.
            // Actually, we can fetch voice recordings that have a corresponding response in the filtered list.
            // For simplicity/performance in this MVP, we'll fetch all voice recordings and filter in memory 
            // OR ignore voice recording count filtering if it's expensive (it requires a join).
            // Let's try to filter by joining if possible, or just exact count.
            // Supabase COUNT with filter is cheap.
            supabaseAdmin.from('voice_recordings').select('*', { count: 'exact', head: true }), // optimizing: skipping join for raw count for now

            applyFilter(supabaseAdmin.from('survey_responses').select('session_id, current_step, started_at, completed_at, is_completed, form_data')),

            // For urgency, we need the extracted data. We'll filter in memory based on the session_ids we get from allResponses.
            supabaseAdmin.from('voice_recordings').select('extracted_data, session_id, duration').eq('processing_status', 'completed'),

            applyFilter(supabaseAdmin.from('survey_responses').select('session_id, email, is_completed, started_at, current_step').order('started_at', { ascending: false }).limit(8)),
        ]);

        const totalResponses = totalResult.count || 0;
        const completedResponses = completedResult.count || 0;
        const voiceCount = voiceResult.count || 0; // consistent with global
        const responses = allResponsesResult.data || [];
        const recordings = voiceRecordingsResult.data || [];
        const recentResponses = recentResult.data || [];

        // Filter recordings to match the fetched responses (since we didn't filter the recordings query)
        const sessionIds = new Set(responses.map((r: any) => r.session_id));
        const filteredRecordings = recordings.filter((r: any) => sessionIds.has(r.session_id));


        // 4. Build Funnel
        const surveySteps = stepsConfig.filter(s => s.id !== 'thank-you');
        const stepCounts = new Map<string, number>();
        for (const step of surveySteps) stepCounts.set(step.id, 0);

        for (const r of responses) {
            const currentStep = r.current_step || (surveyType === 'school_admin' ? 'disruption-gate' : 'pain-check'); // Default start step
            const currentIdx = surveySteps.findIndex(s => s.id === currentStep);

            if (currentIdx !== -1) {
                // Count user in all steps up to and including their current step
                for (let i = 0; i <= currentIdx; i++) {
                    const stepId = surveySteps[i].id;
                    stepCounts.set(stepId, (stepCounts.get(stepId) || 0) + 1);
                }
            }

            // If completed, ensure they count for all steps
            if (r.is_completed) {
                for (const step of surveySteps) {
                    stepCounts.set(step.id, Math.max(stepCounts.get(step.id) || 0, (stepCounts.get(step.id) || 0))); // Wait, if they are completed they should be in all.
                    // Actually, the loop above handles it if current_step is the last one.
                    // But if current_step is wacky, force it.
                }
            }
        }

        const funnel: FunnelStep[] = surveySteps.map((step, i) => ({
            step: step.title.length > 25 ? step.title.substring(0, 25) + '...' : step.title,
            stepId: step.id,
            count: stepCounts.get(step.id) || 0,
            color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
        }));


        // 5. Urgency Analysis
        const urgency: UrgencyDistribution = { low: 0, medium: 0, high: 0, critical: 0, dominant: 'low', dominantPct: 0 };
        let urgencyTotal = 0;
        for (const rec of filteredRecordings) {
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
            urgency.dominant = dominant as any;
            urgency.dominantPct = Math.round((dominantCount / urgencyTotal) * 100);
        }


        // 6. Time Series
        const now = new Date();
        const daily: Array<{ date: string; started: number; completed: number }> = [];
        const completionRate: Array<{ date: string; rate: number }> = [];
        for (let i = 29; i >= 0; i--) {
            const day = startOfDay(subDays(now, i));
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayLabel = format(day, 'MMM dd');
            const started = responses.filter((r: any) => format(startOfDay(new Date(r.started_at)), 'yyyy-MM-dd') === dateStr).length;
            const completed = responses.filter((r: any) => r.completed_at && format(startOfDay(new Date(r.completed_at)), 'yyyy-MM-dd') === dateStr).length;
            daily.push({ date: dayLabel, started, completed });
            completionRate.push({ date: dayLabel, rate: started > 0 ? Math.round((completed / started) * 100) : 0 });
        }

        // 7. Step Durations
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
            voiceRecordings: voiceCount, // This is total voice, not filtered. Accepted for MVP.
            completionRate: totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0,
            funnel,
            urgency,
            timeSeries: { daily, completionRate },
            stepDurations,
            recentResponses,
        };

    } catch (error) {
        console.error('Failed to fetch stats:', error);
        throw error;
    }
}
