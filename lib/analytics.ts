// PostHog analytics wrapper
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog (call once in app)
export function initAnalytics() {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false, // We'll do this manually for more control
        capture_pageleave: true,
        persistence: 'localStorage',
    });
}

// Track page view with step info
export function trackStepView(stepId: string, stepTitle: string) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.capture('survey_step_view', {
        step_id: stepId,
        step_title: stepTitle,
        timestamp: new Date().toISOString(),
    });
}

// Track step completion
export function trackStepComplete(stepId: string, timeSpentMs: number) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.capture('survey_step_complete', {
        step_id: stepId,
        time_spent_ms: timeSpentMs,
        time_spent_seconds: Math.round(timeSpentMs / 1000),
    });
}

// Track drop-off (when user leaves without completing)
export function trackDropOff(stepId: string, timeSpentMs: number) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.capture('survey_drop_off', {
        step_id: stepId,
        time_spent_ms: timeSpentMs,
    });
}

// Track hesitation (time spent on step before action)
export function trackHesitation(stepId: string, hesitationMs: number) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    // Only track notable hesitation (> 5 seconds)
    if (hesitationMs < 5000) return;

    posthog.capture('survey_hesitation', {
        step_id: stepId,
        hesitation_ms: hesitationMs,
        hesitation_seconds: Math.round(hesitationMs / 1000),
    });
}

// Track voice recording
export function trackVoiceRecording(stepId: string, durationSeconds: number) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.capture('voice_recording_complete', {
        step_id: stepId,
        duration_seconds: durationSeconds,
    });
}

// Track survey completion
export function trackSurveyComplete(sessionId: string, totalTimeMs: number) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.capture('survey_complete', {
        session_id: sessionId,
        total_time_ms: totalTimeMs,
        total_time_minutes: Math.round(totalTimeMs / 60000),
    });
}

// Identify user (when they provide email)
export function identifyUser(email: string, sessionId: string) {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.identify(sessionId, {
        email,
        first_seen: new Date().toISOString(),
    });
}

export { posthog };
