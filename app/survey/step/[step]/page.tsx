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
    const { formData, updateFormData } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                What made you want to take this survey today?
            </p>

            <textarea
                className="input-base min-h-[150px] resize-y"
                placeholder="Share what brought you here..."
                value={formData.clickMotivation || ''}
                onChange={(e) => updateFormData({ clickMotivation: e.target.value })}
            />
        </>
    );
}

function Step10Content() {
    const { formData, updateFormData } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6">
                Is there anything else you&apos;d like us to know?
            </p>

            <textarea
                className="input-base min-h-[150px] resize-y"
                placeholder="Any other thoughts, concerns, or suggestions..."
                value={formData.anythingElse || ''}
                onChange={(e) => updateFormData({ anythingElse: e.target.value })}
            />
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
            case '1': // Voice/text input - check for text OR recording
                return !!(data.step1Text || data.step1Recording);
            case '2': // Checkbox selection
                return (formData.issues?.length || 0) > 0;
            case '3': // Ranking - always valid if issues exist
                return (formData.issues?.length || 0) > 0;
            case '4': // Voice/text input
                return !!(data.step4Text || data.step4Recording);
            case '5': // Voice/text input
                return !!(data.step5Text || data.step5Recording);
            case '6': // Checkbox selection
                return (formData.benefits?.length || 0) > 0;
            case '7': // Voice/text input
                return !!(data.step7Text || data.step7Recording);
            case '8': // Voice/text input
                return !!(data.step8Text || data.step8Recording);
            case '9': // Voice/text input
                return !!(data.step9Text || data.step9Recording);
            case '10': // Voice/text input
                return !!(data.step10Text || data.step10Recording);
            default:
                return true;
        }
    };

    const handleNext = async () => {
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
                // Continue navigation even if save fails? 
                // Prefer to continue so user isn't stuck.
            }
        }

        if (next) {
            router.push(next.path);
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
                <div className="mt-auto pt-8 space-y-4">
                    {/* Main buttons - stack on mobile, row on desktop */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                        <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                            Back
                        </Button>

                        <div className="flex-1 flex justify-center sm:justify-end">
                            <SkipButton onClick={handleNext} />
                        </div>

                        <Button
                            onClick={handleNext}
                            disabled={!stepIsValid}
                            className={`w-full sm:w-auto ${!stepIsValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {step === '10' ? 'Almost Done' : 'Continue'}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                    </div>

                    {/* Hint when Continue is disabled */}
                    {!stepIsValid && (
                        <p className="text-center text-sm text-text-muted">
                            Please provide a response to continue, or skip this question
                        </p>
                    )}
                </div>
            </GlassCard>
        </>
    );
}
