'use client';

import { use, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { StepNavigation } from '@/components/survey/StepNavigation';
import { VoiceRecorder } from '@/components/survey/VoiceRecorder';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { useSurvey } from '@/components/providers/SurveyProvider';
import { STEPS, ISSUES_OPTIONS, BENEFITS_OPTIONS, getNextStep, getPrevStep } from '@/config/steps';
import { trackStepView, trackStepComplete, trackHesitation } from '@/lib/analytics';

// Step content components
function Step1Content() {
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

    const handleRecordingComplete = (blob: Blob, duration: number) => {
        setRecordingBlob(blob);
        console.log('Recording complete:', duration, 'seconds');
    };

    return (
        <>
            <p className="text-text-secondary mb-6">
                What is the most challenging aspect of your child&apos;s relationship with screens
                or technology? Please share all the painful parts openly and honestly — feel free
                to just brain dump everything you feel. We are here to listen without judgment.
            </p>

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

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
    const { formData } = useSurvey();
    const selectedIssues = formData.issues || [];

    return (
        <>
            <p className="text-text-secondary mb-6">
                Drag to reorder these from most painful (top) to least painful (bottom):
            </p>

            <div className="space-y-2">
                {selectedIssues.map((issue, index) => {
                    const option = ISSUES_OPTIONS.find(o => o.value === issue);
                    return (
                        <div
                            key={issue}
                            className="flex items-center gap-3 p-4 bg-white/60 border-2 border-gray-200 rounded-xl cursor-grab hover:border-primary-light transition-all"
                        >
                            <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                {index + 1}
                            </span>
                            <span>{option?.label || issue}</span>
                        </div>
                    );
                })}
                {selectedIssues.length === 0 && (
                    <p className="text-text-muted text-center py-8">
                        No issues selected. Go back to Step 2 to select issues.
                    </p>
                )}
            </div>
        </>
    );
}

function Step4Content() {
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

    return (
        <>
            <p className="text-text-secondary mb-6">
                Can you elaborate on why those were the most painful problems for you?
                Also, how urgent would you say solving these problems is for you?
            </p>

            <VoiceRecorder onRecordingComplete={(blob) => setRecordingBlob(blob)} />

            <p className="text-sm text-text-muted italic mt-4">
                Consider: On a scale of 1-10, how urgent is solving this? What happens if
                nothing changes in 6 months?
            </p>
        </>
    );
}

function Step5Content() {
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

    return (
        <>
            <p className="text-text-secondary mb-6">
                Tell us what solutions you&apos;ve tried, what happened, and how much you&apos;ve
                spent trying to fix this.
            </p>

            <VoiceRecorder onRecordingComplete={(blob) => setRecordingBlob(blob)} />

            <p className="text-sm text-text-muted italic mt-4">
                Any apps, rules, taking the phone away, other devices — whatever you&apos;ve tried.
            </p>
        </>
    );
}

function Step6Content() {
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

    return (
        <>
            <p className="text-text-secondary mb-6">
                If you switched your kid to a different phone, what would happen?
            </p>

            <VoiceRecorder onRecordingComplete={(blob) => setRecordingBlob(blob)} />

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
    const stepStartTime = useRef<number>(Date.now());
    const firstInteractionTime = useRef<number | null>(null);

    const stepConfig = STEPS.find(s => s.id === step);
    const StepContent = STEP_CONTENT[step];

    // Track step view on mount
    useEffect(() => {
        stepStartTime.current = Date.now();
        firstInteractionTime.current = null;

        if (stepConfig) {
            trackStepView(step, stepConfig.title);
        }
    }, [step, stepConfig]);

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

    const handleNext = () => {
        const timeSpentMs = Date.now() - stepStartTime.current;
        trackStepComplete(step, timeSpentMs);

        const next = getNextStep(step);
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

    return (
        <>
            <ProgressBar currentStepId={step} />

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                    Step {step} of 10
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                    {stepConfig.title}
                </h1>

                <StepContent />

                <div className="flex gap-4 mt-auto pt-8">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 text-text-secondary hover:border-gray-400 hover:text-text-primary transition-all"
                    >
                        Back
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={handleNext}
                        className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
                    >
                        {step === '10' ? 'Almost Done' : 'Continue'}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </GlassCard>
        </>
    );
}
