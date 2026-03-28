'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { VoiceTextInput } from '@/components/survey/VoiceTextInput';
import { DraggableRanking } from '@/components/survey/DraggableRanking';
import { useSurvey } from '@/components/providers/SurveyProvider';
import {
    CONDENSED_ISSUES_OPTIONS,
    CONDENSED_PRICE_OPTIONS,
    CONDENSED_VARIANT,
    getCondensedNextStep,
    getCondensedPrevStep,
    getCondensedProgress,
    getCondensedStep,
} from '@/config/condensed-parent-survey';

function StepOneContent() {
    const { sessionId } = useSurvey();

    return (
        <>
            <p className="text-text-secondary mb-6 text-base leading-relaxed">
                Share what worries you most about your kid and screens, and tell us what you&apos;ve already tried.
            </p>

            <VoiceTextInput
                sessionId={sessionId}
                stepNumber={1}
                placeholder="My child is up late on YouTube, we argue about it all the time, and the tools we've tried do not really work..."
            />

            <p className="text-sm text-text-muted italic mt-4">
                Specific moments, recurring fights, what you have already tested, and how it feels day to day are all useful here.
            </p>
        </>
    );
}

function StepTwoContent() {
    const { formData, updateFormData } = useSurvey();
    const selectedIssues = formData.issues || [];
    const existingRanking = formData.ranking || [];
    const orderedRanking = [
        ...existingRanking.filter((issue) => selectedIssues.includes(issue)),
        ...selectedIssues.filter((issue) => !existingRanking.includes(issue)),
    ];
    const selectedPrice = formData.priceWillingness?.[0] || '';
    const marketingOptIn = formData.emailOptIn ?? true;

    const handleIssuesChange = (values: string[]) => {
        const nextRanking = [
            ...(formData.ranking || []).filter((issue) => values.includes(issue)),
            ...values.filter((issue) => !(formData.ranking || []).includes(issue)),
        ];

        updateFormData({
            issues: values,
            ranking: nextRanking,
        });
    };

    const rankingItems = selectedIssues.map((issue) => {
        const option = CONDENSED_ISSUES_OPTIONS.find((item) => item.value === issue);
        return {
            value: issue,
            label: option?.label || issue,
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                    Check any issues your family has experienced:
                </p>

                <CheckboxGroup
                    name="condensed-issues"
                    options={CONDENSED_ISSUES_OPTIONS}
                    values={selectedIssues}
                    onChange={handleIssuesChange}
                />
            </div>

            {selectedIssues.length >= 2 && (
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                        Most Painful First
                    </p>
                    <p className="text-text-secondary mb-4">
                        Drag the issues into order so we know what hurts the most.
                    </p>

                    <DraggableRanking
                        items={rankingItems}
                        value={orderedRanking}
                        onChange={(newOrder) => updateFormData({ ranking: newOrder })}
                    />
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-1">
                        How many kids do you have?
                    </p>
                    <p className="text-sm text-text-muted">
                        Specifically, how many of them have these problems?
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {['1', '2', '3', '4+'].map((count) => {
                        const isSelected = formData.kidsWithPhones === count;

                        return (
                            <button
                                key={count}
                                type="button"
                                onClick={() => updateFormData({ kidsWithPhones: count })}
                                className={`min-w-11 rounded-full border-2 px-4 py-3 text-sm font-semibold transition-all ${
                                    isSelected
                                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
                                }`}
                            >
                                {count}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-1">
                        What&apos;s the most you&apos;d pay?
                    </p>
                    <p className="text-sm text-text-muted">
                        Think of a one-time device price if it actually solved these problems.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {CONDENSED_PRICE_OPTIONS.map((option) => {
                        const isSelected = selectedPrice === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateFormData({ priceWillingness: [option.value] })}
                                className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                                    isSelected
                                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'border-gray-200 bg-white text-text-primary hover:border-primary/30 hover:bg-primary/5'
                                }`}
                            >
                                <span className="font-semibold">{option.label}</span>
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                        isSelected ? 'border-white bg-white text-primary' : 'border-gray-300 text-transparent'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(event) => updateFormData({ emailOptIn: event.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary/30"
                />
                <div>
                    <p className="text-sm font-semibold text-text-primary">
                        Keep me updated on BetterPhone
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        We&apos;ll use the email you already entered on the first screen.
                    </p>
                </div>
            </label>
        </div>
    );
}

export default function CondensedSurveyStepPage({
    params,
}: {
    params: Promise<{ step: string }>;
}) {
    const { step } = use(params);
    const router = useRouter();
    const { sessionId, formData } = useSurvey();

    const stepConfig = getCondensedStep(step);

    useEffect(() => {
        if (!sessionId || !stepConfig) {
            return;
        }

        void fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                currentStep: step,
                isCompleted: false,
                surveyVariant: CONDENSED_VARIANT,
            }),
        });
    }, [sessionId, step, stepConfig]);

    useEffect(() => {
        const nextStep = getCondensedNextStep(step);
        const prevStep = getCondensedPrevStep(step);

        if (nextStep) {
            router.prefetch(nextStep.path);
        }

        if (prevStep) {
            router.prefetch(prevStep.path);
        } else {
            router.prefetch('/');
        }
    }, [router, step]);

    if (!stepConfig || step === 'thank-you') {
        return (
            <GlassCard className="text-center">
                <h1 className="text-2xl font-bold mb-4">Step not found</h1>
                <p className="text-text-secondary">Invalid step: {step}</p>
            </GlassCard>
        );
    }

    const isStepValid = () => {
        const data = formData as Record<string, unknown>;

        if (step === '1') {
            return !!(data.step1Text || data.step1Recording);
        }

        if (step === '2') {
            return (
                (formData.issues?.length || 0) > 0 &&
                !!formData.kidsWithPhones &&
                (formData.priceWillingness?.length || 0) > 0
            );
        }

        return true;
    };

    const handleBack = () => {
        const prevStep = getCondensedPrevStep(step);
        if (!prevStep) {
            router.push('/');
            return;
        }

        router.push(prevStep.path);
    };

    const handleNext = () => {
        const nextStep = getCondensedNextStep(step);
        const isComplete = step === '2';
        const destination = nextStep?.path || '/thank-you';

        router.push(destination);

        if (!sessionId) {
            return;
        }

        void fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                ...formData,
                emailOptIn: formData.emailOptIn ?? true,
                currentStep: nextStep?.id || 'thank-you',
                isCompleted: isComplete,
                surveyVariant: CONDENSED_VARIANT,
            }),
        });
    };

    const progress = getCondensedProgress(step);
    const stepValid = isStepValid();

    return (
        <>
            <div className="w-full h-1.5 rounded-full bg-white/70 border border-white/50 overflow-hidden mb-8">
                <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <div className="stagger-children">
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Step {step} of 2
                    </span>

                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3 leading-tight">
                        {stepConfig.title}
                    </h1>

                    <p className="text-text-secondary text-base md:text-lg mb-8 leading-relaxed">
                        {stepConfig.description}
                    </p>

                    {step === '1' ? <StepOneContent /> : <StepTwoContent />}
                </div>

                <div className="mt-auto pt-8">
                    <div className="hidden sm:flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-3 font-medium text-gray-600 transition-all hover:bg-gray-200"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!stepValid}
                            className={`flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition-all shadow-lg ${
                                stepValid
                                    ? 'bg-gradient-to-r from-primary to-emerald-500 text-white hover:shadow-xl hover:scale-[1.02]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {step === '2' ? 'Submit' : 'Continue'}
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>

                    <div className="sm:hidden space-y-3">
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!stepValid}
                            className={`w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold text-lg transition-all ${
                                stepValid
                                    ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-400'
                            }`}
                        >
                            {step === '2' ? 'Submit' : 'Continue'}
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-gray-600 transition-all hover:bg-gray-100"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                        </div>
                    </div>

                    {!stepValid && (
                        <p className="text-center text-sm text-text-muted mt-3">
                            Please answer this step before continuing.
                        </p>
                    )}
                </div>
            </GlassCard>
        </>
    );
}
