'use client';

import { use, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { VoiceTextInput } from '@/components/survey/VoiceTextInput';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { DraggableRanking } from '@/components/survey/DraggableRanking';
import { SkipButton } from '@/components/survey/SkipButton';
import { useSurvey } from '@/components/providers/SurveyProvider';
import { STEPS, ISSUES_OPTIONS, BENEFITS_OPTIONS, getNextStep, getPrevStep } from '@/config/steps';
import { trackStepView, trackStepComplete, trackHesitation } from '@/lib/analytics';

// Step content components
function Step1Content() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                What is the most challenging aspect of your child&apos;s relationship with screens
                or technology? Please share all the painful parts openly and honestly — feel free
                to just brain dump everything you feel. We are here to listen without judgment.
            </p>

            <VoiceTextInput sessionId={sessionId} stepNumber={1} placeholder="Share what's been challenging..." />

            <p className="text-sm text-text-muted italic mt-4">
                Talk about how it feels, specific moments, what&apos;s happening day-to-day.
                Whatever comes to mind.
            </p>
        </>
    );
}

function Step2Content() {
    const { formData, updateFormData } = useSurvey();
    const [issues, setIssues] = useState<string[]>(formData.issues || []);

    const handleChange = (values: string[]) => {
        setIssues(values);
        updateFormData({ issues: values });
    };

    return (
        <>
            <p className="text-text-secondary mb-6">
                Select all that apply to your family:
            </p>

            <CheckboxGroup
                name="issues"
                options={ISSUES_OPTIONS}
                values={issues}
                onChange={handleChange}
            />
        </>
    );
}

function Step3Content() {
    const { formData, updateFormData } = useSurvey();
    const selectedIssues = formData.issues || [];
    const rankedIssues = formData.ranking || selectedIssues;

    // Get items with labels
    const rankingItems = selectedIssues.map(issue => {
        const option = ISSUES_OPTIONS.find(o => o.value === issue);
        return { value: issue, label: option?.label || issue };
    });

    const handleRankingChange = (newOrder: string[]) => {
        updateFormData({ ranking: newOrder });
    };

    return (
        <>
            <p className="text-text-secondary mb-6">
                Drag items to reorder from <span className="text-text-primary font-semibold">most painful</span> (1) to <span className="text-text-primary font-semibold">least painful</span> (bottom):
            </p>

            {selectedIssues.length > 0 ? (
                <DraggableRanking
                    items={rankingItems}
                    value={rankedIssues}
                    onChange={handleRankingChange}
                />
            ) : (
                <p className="text-text-muted text-center py-8">
                    No issues selected. Go back to Step 2 to select issues.
                </p>
            )}
        </>
    );
}

function Step4Content() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                Can you elaborate on why those were the most painful problems for you?
                Also, how urgent would you say solving these problems is for you?
            </p>

            <VoiceTextInput sessionId={sessionId} stepNumber={4} placeholder="Tell us about urgency and why..." />

            <p className="text-sm text-text-muted italic mt-4">
                Consider: On a scale of 1-10, how urgent is solving this? What happens if
                nothing changes in 6 months?
            </p>
        </>
    );
}

function Step5Content() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                Tell us what solutions you&apos;ve tried, what happened, and how much you&apos;ve
                spent trying to fix this.
            </p>

            <VoiceTextInput sessionId={sessionId} stepNumber={5} placeholder="Share what you've tried..." />

            <p className="text-sm text-text-muted italic mt-4">
                Any apps, rules, taking the phone away, other devices — whatever you&apos;ve tried.
            </p>
        </>
    );
}

function Step6Content() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                If you switched your kid to a different phone, what would happen?
            </p>

            <VoiceTextInput sessionId={sessionId} stepNumber={6} placeholder="Tell us about potential reactions..." />

            <p className="text-sm text-text-muted italic mt-4">
                Consider: How would they react? What pushback would you get? What would make
                it easier or harder?
            </p>
        </>
    );
}

function Step7Content() {
    const { formData, updateFormData } = useSurvey();
    const [benefits, setBenefits] = useState<string[]>(formData.benefits || []);

    const handleChange = (values: string[]) => {
        setBenefits(values);
        updateFormData({ benefits: values });
    };

    return (
        <>
            <p className="text-text-secondary mb-6">
                Select the benefits that matter most to you:
            </p>

            <CheckboxGroup
                name="benefits"
                options={BENEFITS_OPTIONS}
                values={benefits}
                onChange={handleChange}
            />
        </>
    );
}

function Step8Content() {
    const { formData, updateFormData } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                Help us understand your family&apos;s situation:
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block font-medium mb-2">Ages of your children</label>
                    <input
                        type="text"
                        className="input-base"
                        placeholder="e.g., 8, 12, 15"
                        value={formData.kidAges || ''}
                        onChange={(e) => updateFormData({ kidAges: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block font-medium mb-2">How many have their own phone?</label>
                    <input
                        type="text"
                        className="input-base"
                        placeholder="e.g., 2"
                        value={formData.kidsWithPhones || ''}
                        onChange={(e) => updateFormData({ kidsWithPhones: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block font-medium mb-2">Current phone/device they use</label>
                    <input
                        type="text"
                        className="input-base"
                        placeholder="e.g., iPhone 12, Android tablet"
                        value={formData.currentDevice || ''}
                        onChange={(e) => updateFormData({ currentDevice: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block font-medium mb-2">How long have they had it?</label>
                    <input
                        type="text"
                        className="input-base"
                        placeholder="e.g., 2 years"
                        value={formData.deviceDuration || ''}
                        onChange={(e) => updateFormData({ deviceDuration: e.target.value })}
                    />
                </div>
            </div>
        </>
    );
}

function Step9Content() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                What made you want to take this survey today?
            </p>

            <VoiceTextInput sessionId={sessionId} stepNumber={9} placeholder="Share what brought you here..." />
        </>
    );
}

function Step10Content() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                Is there anything else you&apos;d like us to know?
            </p>

            <VoiceTextInput sessionId={sessionId} stepNumber={10} placeholder="Any other thoughts, concerns, or suggestions..." />
        </>
    );
}

// Step content mapping
const STEP_CONTENT: Record<string, () => React.ReactNode> = {
    '1': Step1Content,
    '2': Step2Content,
    '3': Step3Content,
    '4': Step4Content,
    '5': Step5Content,
    '6': Step6Content,
    '7': Step7Content,
    '8': Step8Content,
    '9': Step9Content,
    '10': Step10Content,
};

export default function StepPage({ params }: { params: Promise<{ step: string }> }) {
    const { step } = use(params);
    const router = useRouter();
    const { sessionId, formData } = useSurvey();
    const stepStartTime = useRef<number>(Date.now());
    const firstInteractionTime = useRef<number | null>(null);

    const stepConfig = STEPS.find(s => s.id === step);
    const StepContent = STEP_CONTENT[step];

    // Track step view and update DB
    useEffect(() => {
        stepStartTime.current = Date.now();
        firstInteractionTime.current = null;

        if (stepConfig && sessionId) {
            trackStepView(step, stepConfig.title);

            // Update current_step in DB immediately
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    currentStep: step,
                    updatedAt: new Date().toISOString()
                }),
            }).catch(err => console.error('Failed to update step:', err));
        }
    }, [step, stepConfig, sessionId]);

    // Track first interaction (hesitation)
    const handleFirstInteraction = useCallback(() => {
        if (!firstInteractionTime.current) {
            firstInteractionTime.current = Date.now();
            const hesitationMs = firstInteractionTime.current - stepStartTime.current;
            trackHesitation(step, hesitationMs);
        }
    }, [step]);

    if (!stepConfig || !StepContent) {
        return (
            <GlassCard className="text-center">
                <h1 className="text-2xl font-bold mb-4">Step not found</h1>
                <p className="text-text-secondary">Invalid step: {step}</p>
            </GlassCard>
        );
    }

    // Check if step has required data filled
    const isStepValid = (): boolean => {
        // Type-safe access using Record
        const data = formData as Record<string, unknown>;

        switch (step) {
            case '1': // Voice/text input
                return !!(data.step1Text || data.step1Recording);
            case '2': // Checkbox selection - issues
                return (formData.issues?.length || 0) > 0;
            case '3': // Ranking - always valid if issues exist
                return (formData.issues?.length || 0) > 0;
            case '4': // Voice/text input
                return !!(data.step4Text || data.step4Recording);
            case '5': // Voice/text input
                return !!(data.step5Text || data.step5Recording);
            case '6': // Voice/text input
                return !!(data.step6Text || data.step6Recording);
            case '7': // Checkbox selection - benefits
                return (formData.benefits?.length || 0) > 0;
            case '8': // Form fields - ALL fields required
                return !!(formData.kidAges && formData.kidsWithPhones && formData.currentDevice && formData.deviceDuration);
            case '9': // Voice/text input
                return !!(data.step9Text || data.step9Recording);
            case '10': // Voice/text input
                return !!(data.step10Text || data.step10Recording);
            default:
                return true;
        }
    };

    const [isNavigating, setIsNavigating] = useState(false);

    const handleNext = async () => {
        setIsNavigating(true);
        const timeSpentMs = Date.now() - stepStartTime.current;
        trackStepComplete(step, timeSpentMs);

        const next = getNextStep(step);

        // Save form data and update to next step
        if (sessionId) {
            try {
                await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        ...formData,
                        currentStep: next?.id || step,
                        isCompleted: step === '10', // Mark completed on last step
                    }),
                });
            } catch (err) {
                console.error('Failed to save progress:', err);
                // Continue navigation even if save fails
            }
        }

        if (next) {
            router.push(next.path);
        } else {
            setIsNavigating(false);
        }
    };

    const handleBack = () => {
        const prev = getPrevStep(step);
        if (prev) {
            router.push(prev.path);
        }
    };

    const stepIsValid = isStepValid();

    return (
        <>
            <ProgressBar currentStepId={step} />

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <div className="stagger-children">
                    {/* Step indicator */}
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                        Step {step} of 10
                    </span>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 leading-tight">
                        {stepConfig.title}
                    </h1>

                    {/* Content */}
                    <div className="mb-8">
                        <StepContent />
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8">
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                        {/* Left: Back + Skip */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-5 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-all"
                            >
                                Skip
                            </button>
                        </div>

                        {/* Right: Continue */}
                        <button
                            onClick={handleNext}
                            disabled={!stepIsValid || isNavigating}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg ${stepIsValid && !isNavigating
                                    ? 'bg-gradient-to-r from-primary to-emerald-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isNavigating ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {step === '10' ? 'Almost Done' : 'Continue'}
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-3">
                        {/* Continue button - prominent at top */}
                        <button
                            onClick={handleNext}
                            disabled={!stepIsValid || isNavigating}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-lg transition-all ${stepIsValid && !isNavigating
                                    ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg active:scale-[0.98]'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                        >
                            {isNavigating ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {step === '10' ? 'Almost Done' : 'Continue'}
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {/* Back and Skip row */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 rounded-lg text-sm font-medium transition-all active:scale-95"
                            >
                                Skip
                            </button>
                        </div>
                    </div>

                    {/* Hint when Continue is disabled */}
                    {!stepIsValid && (
                        <p className="text-center text-sm text-text-muted mt-3">
                            Please provide a response to continue
                        </p>
                    )}
                </div>
            </GlassCard>
        </>
    );
}
