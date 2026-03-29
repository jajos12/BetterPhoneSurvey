'use client';

import { use, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { VoiceTextInput } from '@/components/survey/VoiceTextInput';
import { DraggableRanking } from '@/components/survey/DraggableRanking';
import { useSurvey } from '@/components/providers/SurveyProvider';
import {
    CONDENSED_AGE_OPTIONS,
    CONDENSED_DEVICE_OPTIONS,
    CONDENSED_FEATURE_OPTIONS,
    CONDENSED_ISSUES_OPTIONS,
    CONDENSED_PRICE_OPTIONS,
    CONDENSED_QUALIFIER_OPTIONS,
    CONDENSED_VARIANT,
    getCondensedProgress,
    getCondensedStep,
} from '@/config/condensed-parent-survey';
import type { SurveyFormData } from '@/types/survey';

type Option = {
    value: string;
    label: string;
};

type ReferralStackProps = {
    values: string[];
    onChange: (values: string[]) => void;
    minFields: number;
    maxFields: number;
    allowAddMore?: boolean;
};

function ensureStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function sanitizeStringArray(value: unknown): string[] {
    return ensureStringArray(value)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function ensureMinimumFields(values: string[], minFields: number): string[] {
    if (values.length >= minFields) {
        return values;
    }

    return [...values, ...Array.from({ length: minFields - values.length }, () => '')];
}

function createRankingItems(selectedValues: string[]): Array<{ value: string; label: string }> {
    return selectedValues.map((value) => ({ value, label: value }));
}

function mergeRanking(selectedValues: string[], currentRanking: string[]) {
    return [
        ...currentRanking.filter((value) => selectedValues.includes(value)),
        ...selectedValues.filter((value) => !currentRanking.includes(value)),
    ];
}

function TogglePillGroup({
    options,
    values,
    onChange,
}: {
    options: readonly Option[];
    values: string[];
    onChange: (values: string[]) => void;
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {options.map((option) => {
                const isSelected = values.includes(option.value);

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                            onChange(
                                isSelected
                                    ? values.filter((value) => value !== option.value)
                                    : [...values, option.value]
                            )
                        }
                        className={`rounded-full border-2 px-4 py-3 text-sm font-semibold transition-all ${
                            isSelected
                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function SingleSelectPillGroup({
    options,
    value,
    onChange,
}: {
    options: readonly Option[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {options.map((option) => {
                const isSelected = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-full border-2 px-4 py-3 text-sm font-semibold transition-all ${
                            isSelected
                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function SectionBlock({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-1">{title}</p>
                {description ? <p className="text-sm text-text-muted">{description}</p> : null}
            </div>
            {children}
        </section>
    );
}

function ReferralStack({ values, onChange, minFields, maxFields, allowAddMore = false }: ReferralStackProps) {
    const visibleValues = ensureMinimumFields(values, minFields);

    const handleValueChange = (index: number, nextValue: string) => {
        const nextValues = [...visibleValues];
        nextValues[index] = nextValue;
        onChange(nextValues);
    };

    const handleAddField = () => {
        if (visibleValues.length >= maxFields) {
            return;
        }

        onChange([...visibleValues, '']);
    };

    return (
        <div className="space-y-3">
            {visibleValues.map((value, index) => (
                <input
                    key={`referral-${index}`}
                    type="text"
                    value={value}
                    onChange={(event) => handleValueChange(index, event.target.value)}
                    placeholder="Email or phone"
                    className="input-base"
                />
            ))}

            {allowAddMore && visibleValues.length < maxFields ? (
                <button
                    type="button"
                    onClick={handleAddField}
                    className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                    + Add another
                </button>
            ) : null}
        </div>
    );
}

function StepFrame({
    stepId,
    title,
    description,
    eyebrow,
    progress,
    children,
}: {
    stepId: string;
    title: string;
    description: string;
    eyebrow?: string;
    progress?: number;
    children: ReactNode;
}) {
    return (
        <>
            {progress ? (
                <div className="w-full h-1.5 rounded-full bg-white/70 border border-white/50 overflow-hidden mb-8">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            ) : null}

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <div className="stagger-children">
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        {eyebrow || stepId}
                    </span>

                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3 leading-tight">
                        {title}
                    </h1>

                    <p className="text-text-secondary text-base md:text-lg mb-8 leading-relaxed">
                        {description}
                    </p>

                    {children}
                </div>
            </GlassCard>
        </>
    );
}

export default function CondensedSurveyStepPage({
    params,
}: {
    params: Promise<{ step: string }>;
}) {
    const { step } = use(params);
    const router = useRouter();
    const { sessionId, formData, updateFormData } = useSurvey();
    const stepConfig = getCondensedStep(step);
    const surveyData = formData as Partial<SurveyFormData>;

    const selectedIssues = ensureStringArray(surveyData.issues);
    const issueRanking = mergeRanking(selectedIssues, ensureStringArray(surveyData.ranking));
    const ageRanges = ensureStringArray(surveyData.ageRanges);
    const selectedFeatures = ensureStringArray(surveyData.features);
    const featureRanking = mergeRanking(selectedFeatures, ensureStringArray(surveyData.featureRanking));
    const currentDevices = ensureStringArray(surveyData.currentDevices);
    const screenedOutReferrals = ensureStringArray(surveyData.screenedOutReferrals);
    const thankYouReferrals = ensureStringArray(surveyData.thankYouReferrals);
    const selectedPrice = ensureStringArray(surveyData.priceWillingness)[0] || '';
    const painCheck = typeof surveyData.painCheck === 'string' ? surveyData.painCheck : null;
    const kidsWithPhones = typeof surveyData.kidsWithPhones === 'string' ? surveyData.kidsWithPhones : '';
    const emailOptIn = surveyData.emailOptIn ?? true;
    const noPathSubmitted = Boolean(surveyData.screenedOutSubmitted);
    const bonusSubmitted = Boolean(surveyData.bonusSubmitted);

    if (!stepConfig) {
        return (
            <GlassCard className="text-center">
                <h1 className="text-2xl font-bold mb-4">Step not found</h1>
                <p className="text-text-secondary">Invalid step: {step}</p>
            </GlassCard>
        );
    }

    const persistFormData = (overrides: Partial<SurveyFormData>) => {
        const payload: Partial<SurveyFormData> = {
            ...surveyData,
            ...overrides,
            surveyVariant: CONDENSED_VARIANT,
            emailOptIn: overrides.emailOptIn ?? surveyData.emailOptIn ?? true,
            issues: ensureStringArray(overrides.issues ?? surveyData.issues),
            ranking: ensureStringArray(overrides.ranking ?? surveyData.ranking),
            ageRanges: ensureStringArray(overrides.ageRanges ?? surveyData.ageRanges),
            features: ensureStringArray(overrides.features ?? surveyData.features),
            featureRanking: ensureStringArray(overrides.featureRanking ?? surveyData.featureRanking),
            priceWillingness: ensureStringArray(overrides.priceWillingness ?? surveyData.priceWillingness),
            currentDevices: ensureStringArray(overrides.currentDevices ?? surveyData.currentDevices),
            screenedOutReferrals: sanitizeStringArray(overrides.screenedOutReferrals ?? surveyData.screenedOutReferrals),
            thankYouReferrals: sanitizeStringArray(overrides.thankYouReferrals ?? surveyData.thankYouReferrals),
        };

        updateFormData(payload);

        if (!sessionId) {
            return;
        }

        void fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                ...payload,
            }),
        });
    };

    const goTo = (path: string, overrides: Partial<SurveyFormData>) => {
        persistFormData(overrides);
        router.push(path);
    };

    const handleBack = () => {
        switch (step) {
            case 'qualifier':
                router.push('/');
                break;
            case 'no-path':
                router.push('/step/qualifier');
                break;
            case '1':
                router.push('/step/qualifier');
                break;
            case '2':
                router.push('/step/1');
                break;
            case '3':
                router.push('/step/2');
                break;
            case '4':
                router.push('/step/3');
                break;
            case 'thank-you':
                router.push('/step/4');
                break;
            case 'bonus':
                router.push('/step/thank-you');
                break;
            default:
                router.push('/');
        }
    };

    const handleNext = () => {
        switch (step) {
            case 'qualifier':
                if (!painCheck) {
                    return;
                }

                if (painCheck === 'no') {
                    goTo('/step/no-path', {
                        painCheck,
                        screenedOut: true,
                        screenedOutSubmitted: false,
                        currentStep: 'no-path',
                        isCompleted: false,
                    });
                    return;
                }

                goTo('/step/1', {
                    painCheck,
                    screenedOut: false,
                    screenedOutSubmitted: false,
                    currentStep: '1',
                    isCompleted: false,
                });
                return;
            case '1':
                goTo('/step/2', {
                    currentStep: '2',
                    isCompleted: false,
                });
                return;
            case '2':
                goTo('/step/3', {
                    issues: selectedIssues,
                    ranking: issueRanking,
                    ageRanges,
                    currentStep: '3',
                    isCompleted: false,
                });
                return;
            case '3':
                goTo('/step/4', {
                    features: selectedFeatures,
                    featureRanking,
                    currentStep: '4',
                    isCompleted: false,
                });
                return;
            case '4':
                goTo('/step/thank-you', {
                    currentStep: 'thank-you',
                    isCompleted: true,
                });
                return;
            default:
                return;
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 'qualifier':
                return Boolean(painCheck);
            case '1':
                return Boolean(surveyData.step1Text || surveyData.step1Recording);
            case '2':
                return selectedIssues.length > 0 && Boolean(kidsWithPhones);
            case '3':
                return selectedFeatures.length > 0;
            case '4':
                return Boolean(surveyData.objectionText || surveyData.objectionRecording);
            default:
                return true;
        }
    };

    const renderQualifier = () => (
        <div className="space-y-8">
            <p className="text-text-secondary text-base leading-relaxed">
                We only need one quick check before we dive in.
            </p>

            <RadioGroup
                name="condensed-qualifier"
                options={CONDENSED_QUALIFIER_OPTIONS as unknown as Option[]}
                value={painCheck}
                onChange={(value) => updateFormData({ painCheck: value as SurveyFormData['painCheck'] })}
            />
        </div>
    );

    const renderStepOne = () => (
        <>
            <p className="text-text-secondary mb-6 text-base leading-relaxed">
                Share specific moments, what you have tried already, and how it feels day to day.
            </p>

            <VoiceTextInput
                sessionId={sessionId}
                stepNumber={1}
                placeholder="My child is on YouTube until midnight, we fight about it constantly, and the built-in controls do not really stop anything..."
            />

            <p className="text-sm text-text-muted italic mt-4">
                Voice is easiest, but typed detail works too. The more concrete this is, the more helpful it is.
            </p>
        </>
    );

    const renderStepTwo = () => (
        <div className="space-y-8">
            <div>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                    Check any issues your family has experienced:
                </p>

                <CheckboxGroup
                    name="condensed-issues"
                    options={CONDENSED_ISSUES_OPTIONS as unknown as Option[]}
                    values={selectedIssues}
                    onChange={(values) =>
                        updateFormData({
                            issues: values,
                            ranking: mergeRanking(values, issueRanking),
                        })
                    }
                />
            </div>

            {selectedIssues.length >= 2 ? (
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                        Most Painful First
                    </p>
                    <p className="text-text-secondary mb-4">
                        Drag the issues into order so we know what hurts the most.
                    </p>

                    <DraggableRanking
                        items={createRankingItems(selectedIssues)}
                        value={issueRanking}
                        onChange={(newOrder) => updateFormData({ ranking: newOrder })}
                    />
                </div>
            ) : null}

            <SectionBlock
                title="How many kids do you have?"
                description="Specifically, how many of them have these problems?"
            >
                <SingleSelectPillGroup
                    options={[
                        { value: '1', label: '1' },
                        { value: '2', label: '2' },
                        { value: '3', label: '3' },
                        { value: '4+', label: '4+' },
                    ]}
                    value={kidsWithPhones}
                    onChange={(value) => updateFormData({ kidsWithPhones: value })}
                />
            </SectionBlock>

            <SectionBlock title="What age range?" description="Select all that apply.">
                <TogglePillGroup
                    options={CONDENSED_AGE_OPTIONS as unknown as Option[]}
                    values={ageRanges}
                    onChange={(values) => updateFormData({ ageRanges: values })}
                />
            </SectionBlock>
        </div>
    );

    const renderStepThree = () => (
        <div className="space-y-8">
            <div>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                    What would matter most in your child&apos;s phone?
                </p>

                <CheckboxGroup
                    name="condensed-features"
                    options={CONDENSED_FEATURE_OPTIONS as unknown as Option[]}
                    values={selectedFeatures}
                    onChange={(values) =>
                        updateFormData({
                            features: values,
                            featureRanking: mergeRanking(values, featureRanking),
                        })
                    }
                />
            </div>

            {selectedFeatures.length >= 2 ? (
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                        Rank by Importance
                    </p>
                    <p className="text-text-secondary mb-4">
                        Drag your top features into order so we know what matters most.
                    </p>

                    <DraggableRanking
                        items={createRankingItems(selectedFeatures)}
                        value={featureRanking}
                        onChange={(newOrder) => updateFormData({ featureRanking: newOrder })}
                    />
                </div>
            ) : null}
        </div>
    );

    const renderStepFour = () => (
        <div className="space-y-8">
            <div>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                    Contracts, kid pushback, trust issues, price, or skepticism all count here.
                </p>

                <VoiceTextInput
                    sessionId={sessionId}
                    stepNumber={4}
                    textFieldKey="objectionText"
                    recordingFieldKey="objectionRecording"
                    placeholder="We are locked into our carrier, my kid would push back hard, and I would need to know this actually works before we switched..."
                />
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <input
                    type="checkbox"
                    checked={emailOptIn}
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

    const renderNoPath = () => {
        if (noPathSubmitted) {
            return (
                <StepFrame
                    stepId={step}
                    title="Thanks!"
                    description="We will reach out to those referrals. You are helping more than you know."
                    eyebrow="Referral Sent"
                >
                    <div className="text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <button type="button" onClick={() => router.push('/')} className="btn-primary">
                            Back to Survey Home
                        </button>
                    </div>
                </StepFrame>
            );
        }

        return (
            <StepFrame
                stepId={step}
                title={stepConfig.title}
                description={stepConfig.description}
                eyebrow={stepConfig.eyebrow}
            >
                <div className="space-y-8">
                    <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 text-center">
                        <p className="text-lg font-semibold text-primary mb-1">
                            Get a $20 BetterPhone gift card for each referral
                        </p>
                        <p className="text-sm text-text-secondary">
                            Up to 5 referrals. That&apos;s up to $100 off.
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">
                            Know a parent dealing with this?
                        </p>
                        <p className="text-sm text-text-muted mb-4">
                            Drop their email or phone number and we&apos;ll reach out.
                        </p>
                        <ReferralStack
                            values={screenedOutReferrals}
                            onChange={(values) => updateFormData({ screenedOutReferrals: values })}
                            minFields={5}
                            maxFields={5}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                        <button type="button" onClick={handleBack} className="btn-secondary">
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                persistFormData({
                                    screenedOut: true,
                                    screenedOutSubmitted: true,
                                    currentStep: 'no-path',
                                    isCompleted: true,
                                })
                            }
                            className="btn-primary"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </StepFrame>
        );
    };

    const renderThankYou = () => (
        <StepFrame
            stepId={step}
            title={stepConfig.title}
            description="Your experience matters more than you know. We are building this for families like yours, and your answers are shaping every decision we make."
            eyebrow={stepConfig.eyebrow}
        >
            <div className="space-y-8">
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 text-center">
                    <p className="text-lg font-semibold text-primary">
                        Check your email for your BetterPhone gift card.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">
                            Know any other parents dealing with this?
                        </p>
                        <p className="text-sm text-text-muted">
                            Drop their info and we&apos;ll reach out. It would really help our cause.
                        </p>
                    </div>

                    <ReferralStack
                        values={thankYouReferrals}
                        onChange={(values) => updateFormData({ thankYouReferrals: values })}
                        minFields={3}
                        maxFields={8}
                        allowAddMore
                    />
                </div>

                <div className="rounded-3xl border border-primary/10 bg-white p-6 text-center">
                    <p className="text-lg font-semibold text-text-primary mb-1">
                        Want another $15 off your BetterPhone?
                    </p>
                    <p className="text-sm text-text-muted">
                        Answer a couple quick optional questions.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            persistFormData({
                                thankYouReferrals,
                                currentStep: 'thank-you',
                                isCompleted: true,
                            });
                            router.push('/');
                        }}
                        className="btn-secondary"
                    >
                        No Thanks
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            goTo('/step/bonus', {
                                thankYouReferrals,
                                currentStep: 'bonus',
                                isCompleted: true,
                            })
                        }
                        className="btn-primary"
                    >
                        Sure!
                    </button>
                </div>
            </div>
        </StepFrame>
    );

    const renderBonus = () => {
        if (bonusSubmitted) {
            return (
                <StepFrame
                    stepId={step}
                    title="You're all set!"
                    description="Your extra discount has been applied. We will send the details to your email."
                    eyebrow="Bonus Complete"
                >
                    <div className="text-center space-y-6">
                        <p className="text-text-secondary">
                            Thank you for going above and beyond. It means a lot.
                        </p>

                        <button type="button" onClick={() => router.push('/')} className="btn-primary">
                            Back to Survey Home
                        </button>
                    </div>
                </StepFrame>
            );
        }

        return (
            <StepFrame
                stepId={step}
                title={stepConfig.title}
                description="What have you tried to fix this, what should we get right, or is there anything else we should know?"
                eyebrow={stepConfig.eyebrow}
            >
                <div className="space-y-8">
                    <VoiceTextInput
                        sessionId={sessionId}
                        stepNumber={5}
                        textFieldKey="bonusText"
                        recordingFieldKey="bonusRecording"
                        placeholder="Apps you have tried, rules you have set, things that worked or failed, and what BetterPhone absolutely has to get right..."
                    />

                    <SectionBlock title="What device does your kid currently use?">
                        <TogglePillGroup
                            options={CONDENSED_DEVICE_OPTIONS as unknown as Option[]}
                            values={currentDevices}
                            onChange={(values) => updateFormData({ currentDevices: values })}
                        />
                    </SectionBlock>

                    <SectionBlock
                        title="What's the most you'd pay for a phone that solves all of this?"
                        description="One-time device price. Imagine it actually fixed these problems for your kid."
                    >
                        <SingleSelectPillGroup
                            options={CONDENSED_PRICE_OPTIONS as unknown as Option[]}
                            value={selectedPrice}
                            onChange={(value) => updateFormData({ priceWillingness: [value] })}
                        />
                    </SectionBlock>

                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                        <button type="button" onClick={handleBack} className="btn-secondary">
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                persistFormData({
                                    currentStep: 'bonus',
                                    isCompleted: true,
                                    bonusSubmitted: true,
                                })
                            }
                            className="btn-primary"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </StepFrame>
        );
    };

    if (step === 'no-path') {
        return renderNoPath();
    }

    if (step === 'thank-you') {
        return renderThankYou();
    }

    if (step === 'bonus') {
        return renderBonus();
    }

    const stepValid = isStepValid();
    const progress = getCondensedProgress(step);

    return (
        <StepFrame
            stepId={step}
            title={stepConfig.title}
            description={stepConfig.description}
            eyebrow={
                stepConfig.displayStep && stepConfig.displayStepCount
                    ? `Step ${stepConfig.displayStep} of ${stepConfig.displayStepCount}`
                    : stepConfig.eyebrow
            }
            progress={progress}
        >
            {step === 'qualifier'
                ? renderQualifier()
                : step === '1'
                  ? renderStepOne()
                  : step === '2'
                    ? renderStepTwo()
                    : step === '3'
                      ? renderStepThree()
                      : renderStepFour()}

            <div className="mt-10 pt-6 border-t border-gray-100">
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
                        {step === '4' ? 'Submit' : 'Continue'}
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
                        {step === '4' ? 'Submit' : 'Continue'}
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

                {!stepValid ? (
                    <p className="text-center text-sm text-text-muted mt-3">
                        Please answer this step before continuing.
                    </p>
                ) : null}
            </div>
        </StepFrame>
    );
}
