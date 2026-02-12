'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AdminVoiceInput } from '@/components/school-admin/AdminVoiceInput';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { DraggableRanking } from '@/components/survey/DraggableRanking';
import { useSchoolAdmin } from '@/components/providers/SchoolAdminProvider';
import {
    ADMIN_STEPS,
    SCHOOL_ISSUES_OPTIONS,
    SOLUTIONS_TRIED_OPTIONS,
    BUDGET_OPTIONS,
    POLICY_OPTIONS,
    SCHOOL_TYPE_OPTIONS,
    GRADE_LEVEL_OPTIONS,
    ROLE_OPTIONS,
    PILOT_INTEREST_OPTIONS,
    CALL_INTEREST_OPTIONS,
    getAdminNextStep,
    getAdminPrevStep,
    getAdminProgress
} from '@/config/school-admin-steps';

// ── Step Content Components ────────────────────────────────

function Step1Content() { // Discovery
    const { sessionId, formData, updateFormData } = useSchoolAdmin();
    return (
        <AdminVoiceInput
            sessionId={sessionId}
            stepNumber={1}
            placeholder="I saw an ad about..."
            initialValue={formData.step1Text}
            onTextChange={(text) => updateFormData({ step1Text: text })}
        />
    );
}

function Step2Content() { // Biggest Challenge (Voice)
    const { sessionId, formData } = useSchoolAdmin();
    return (
        <>
            <p className="text-text-secondary mb-6">
                Share openly about specific incidents, how it feels day-to-day, and what's at stake.
            </p>
            <AdminVoiceInput
                sessionId={sessionId}
                stepNumber={2}
                placeholder="The biggest challenge is..."
                initialValue={formData.step2Text}
            />
        </>
    );
}

function Step3Content({ onNext }: { onNext: (data: any) => void }) { // Issues Checkbox
    const { formData } = useSchoolAdmin();
    // Initialize from global state, but don't sync back via effect
    const [selected, setSelected] = useState<string[]>(formData.schoolIssues || []);

    const handleChange = (newSelected: string[]) => {
        setSelected(newSelected);
        onNext({ schoolIssues: newSelected });
    };

    return (
        <CheckboxGroup
            name="schoolIssues"
            options={SCHOOL_ISSUES_OPTIONS}
            values={selected}
            onChange={handleChange}
        />
    );
}

function Step4Content({ onNext }: { onNext: (data: any) => void }) { // Ranking
    const { formData } = useSchoolAdmin();
    const selectedIssues = formData.schoolIssues || [];
    const rankedIssues = formData.issueRanking || selectedIssues;

    const validIssues = selectedIssues.filter(issue => selectedIssues.includes(issue));

    const currentOrder = [
        ...rankedIssues.filter(i => validIssues.includes(i)),
        ...validIssues.filter(i => !rankedIssues.includes(i))
    ];

    const items = validIssues.map(issue => ({
        value: issue,
        label: SCHOOL_ISSUES_OPTIONS.find(o => o.value === issue)?.label || issue
    }));

    const handleChange = (newOrder: string[]) => {
        onNext({ issueRanking: newOrder });
    };

    if (items.length === 0) {
        return <p className="text-text-muted">No issues selected to rank.</p>;
    }

    return (
        <DraggableRanking
            items={items}
            value={currentOrder}
            onChange={handleChange}
        />
    );
}

function Step5Content({ onNext }: { onNext: (data: any) => void }) { // Solutions Tried
    const { formData } = useSchoolAdmin();
    const [selected, setSelected] = useState<string[]>(formData.solutionsTried || []);

    const handleChange = (newSelected: string[]) => {
        setSelected(newSelected);
        onNext({ solutionsTried: newSelected });
    };

    return (
        <CheckboxGroup
            name="solutionsTried"
            options={SOLUTIONS_TRIED_OPTIONS}
            values={selected}
            onChange={handleChange}
        />
    );
}

function Step6Content({ onNext }: { onNext: (data: any) => void }) { // Solution Effectiveness
    const { formData } = useSchoolAdmin();
    const solutions = formData.solutionsTried || [];
    const [effectiveness, setEffectiveness] = useState<Record<string, string>>(formData.solutionEffectiveness || {});

    const handleChange = (sol: string, val: string) => {
        const newState = { ...effectiveness, [sol]: val };
        setEffectiveness(newState);
        onNext({ solutionEffectiveness: newState });
    };

    if (solutions.length === 0) return <p className="text-text-muted">No solutions selected previously.</p>;

    const OPTIONS = [
        { value: 'worked-well', label: 'Worked well' },
        { value: 'helped-somewhat', label: 'Helped somewhat' },
        { value: 'didnt-work', label: 'Didn\'t work' },
        { value: 'created-problems', label: 'Created new problems' },
        { value: 'abandoned', label: 'Abandoned it' },
    ];

    return (
        <div className="space-y-8">
            {solutions.map(sol => {
                const label = SOLUTIONS_TRIED_OPTIONS.find(o => o.value === sol)?.label || sol;
                return (
                    <div key={sol} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="font-bold text-text-primary mb-4">{label}</p>
                        <RadioGroup
                            name={`effectiveness-${sol}`}
                            options={OPTIONS}
                            value={effectiveness[sol] || null}
                            onChange={(val) => handleChange(sol, val)}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function Step7Content() { // Barriers (Voice)
    const { sessionId, formData } = useSchoolAdmin();
    return (
        <>
            <p className="text-text-secondary mb-6">
                Think about parent reactions, staff buy-in, cost, district politics, or student pushback.
            </p>
            <AdminVoiceInput
                sessionId={sessionId}
                stepNumber={7}
                placeholder="It would be hard because..."
                initialValue={formData.step7Text}
            />
        </>
    );
}

function Step8Content({ onNext }: { onNext: (data: any) => void }) { // School Profile
    const { formData } = useSchoolAdmin();

    // We can init state from formData
    // We update on every change.

    const update = (field: string, val: any) => {
        // We don't need local state if we bubble up immediately, 
        // BUT inputs need to be controlled.
        // We can just bubble up the partial change?
        // Let's keep it simple: read from formData directly + bubble up changes.
        // Wait, if we bubble up, global state updates, re-renders this component.
        // So we can use formData as the source of truth if we want.
        // Or keep local state for speed and avoiding flicker if context is slow.
        // Context is usually fast enough.
        // Let's stick to the pattern:
        onNext({ [field]: val });
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">School Type</label>
                <select
                    className="input-base bg-black/20"
                    value={formData.schoolType || ''}
                    onChange={(e) => update('schoolType', e.target.value)}
                >
                    <option value="">Select...</option>
                    {SCHOOL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Grade Level</label>
                    <select
                        className="input-base bg-black/20"
                        value={formData.gradeLevel || ''}
                        onChange={(e) => update('gradeLevel', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {GRADE_LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Enrollment</label>
                    <input
                        type="number"
                        className="input-base bg-black/20"
                        placeholder="e.g. 500"
                        value={formData.enrollment || ''}
                        onChange={(e) => update('enrollment', e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Your Role</label>
                <select
                    className="input-base bg-black/20"
                    value={formData.adminRole || ''}
                    onChange={(e) => update('adminRole', e.target.value)}
                >
                    <option value="">Select...</option>
                    {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Location (City, State)</label>
                <input
                    type="text"
                    className="input-base bg-black/20"
                    placeholder="e.g. Austin, TX"
                    value={formData.schoolLocation || ''}
                    onChange={(e) => update('schoolLocation', e.target.value)}
                />
            </div>
        </div>
    );
}

function Step9Content({ onNext }: { onNext: (data: any) => void }) { // Current Policy
    const { formData } = useSchoolAdmin();
    // Local state for smoother slider interaction
    const [compliance, setCompliance] = useState(formData.compliancePercent || 50);

    const handlePolicyChange = (val: string) => {
        onNext({ currentPolicy: val });
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setCompliance(val);
        // Debouncing would be ideal but for now let's just update
        onNext({ compliancePercent: val });
    };

    return (
        <div className="space-y-8">
            <RadioGroup
                name="currentPolicy"
                options={POLICY_OPTIONS}
                value={formData.currentPolicy || null}
                onChange={handlePolicyChange}
            />

            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <label className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                    <span>Student Compliance Estimate</span>
                </label>

                {/* Large value display */}
                <div className="text-center mb-4">
                    <span className="text-5xl font-black text-cyan-400">{compliance}</span>
                    <span className="text-2xl font-bold text-cyan-400/60">%</span>
                </div>

                {/* Custom slider track */}
                <div className="relative pt-2 pb-1">
                    {/* Background track */}
                    <div className="absolute top-[18px] left-0 right-0 h-3 bg-white/10 rounded-full" />
                    {/* Filled track */}
                    <div
                        className="absolute top-[18px] left-0 h-3 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-150"
                        style={{ width: `${compliance}%` }}
                    />
                    {/* Tick marks */}
                    <div className="absolute top-[18px] left-0 right-0 h-3 flex justify-between px-[6px]">
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => (
                            <div key={tick} className={`w-0.5 h-3 rounded-full ${tick <= compliance ? 'bg-white/30' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    {/* Actual range input */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={compliance}
                        onChange={handleSliderChange}
                        className="relative z-10 w-full h-8 appearance-none bg-transparent cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-cyan-500
                            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/40
                            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
                            [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7
                            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
                            [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-cyan-500
                            [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-grab
                            [&::-moz-range-track]:bg-transparent"
                    />
                </div>

                {/* Labels with emoji */}
                <div className="flex justify-between text-xs font-medium mt-1">
                    <span className="text-red-400">🚫 Ignoring it</span>
                    <span className="text-white/30">50%</span>
                    <span className="text-emerald-400">✅ Following it</span>
                </div>
            </div>
        </div>
    );
}

function Step10Content({ onNext }: { onNext: (data: any) => void }) { // Budget
    const { formData } = useSchoolAdmin();
    const [selected, setSelected] = useState(formData.budgetRange || null);

    const handleChange = (val: string) => {
        setSelected(val);
        onNext({ budgetRange: val });
    };

    return (
        <RadioGroup
            name="budget"
            options={BUDGET_OPTIONS}
            value={selected}
            onChange={handleChange}
        />
    );
}

function Step11Content() { // Decision Process
    const { sessionId, formData, updateFormData } = useSchoolAdmin();
    return (
        <AdminVoiceInput
            sessionId={sessionId}
            stepNumber={11}
            placeholder="Decisions are made by..."
            initialValue={formData.step11Text}
            onTextChange={(text) => updateFormData({ step11Text: text })}
        />
    );
}

function Step12Content({ onNext }: { onNext: (data: any) => void }) { // Pilot Interest
    const { formData } = useSchoolAdmin();
    const [selected, setSelected] = useState(formData.pilotInterest || null);

    const handleChange = (val: string) => {
        setSelected(val);
        onNext({ pilotInterest: val });
    };

    return (
        <RadioGroup
            name="pilotInterest"
            options={PILOT_INTEREST_OPTIONS}
            value={selected}
            onChange={handleChange}
        />
    );
}

function Step13Content({ onNext }: { onNext: (data: any) => void }) { // Contact / Call
    const { formData } = useSchoolAdmin();
    // We can rely on formData for source of truth to simplify
    const interest = formData.callInterest;

    const handleInterestChange = (val: string) => {
        onNext({ callInterest: val });
    };

    const updateDetail = (field: string, val: string) => {
        onNext({ [field]: val });
    };

    return (
        <div className="space-y-6">
            <RadioGroup
                name="callInterest"
                options={CALL_INTEREST_OPTIONS}
                value={interest || null}
                onChange={handleInterestChange}
            />

            {interest === 'yes' && (
                <div className="animate-fade-in space-y-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <p className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Contact Details</p>

                    <input
                        type="tel"
                        className="input-base bg-black/40"
                        placeholder="Best Phone Number"
                        value={formData.contactPhone || ''}
                        onChange={(e) => updateDetail('contactPhone', e.target.value)}
                    />
                    <input
                        type="text"
                        className="input-base bg-black/40"
                        placeholder="Preferred Day/Time"
                        value={formData.contactPreferredTime || ''}
                        onChange={(e) => updateDetail('contactPreferredTime', e.target.value)}
                    />
                    <input
                        type="text"
                        className="input-base bg-black/40"
                        placeholder="Preferred Name"
                        value={formData.contactName || ''}
                        onChange={(e) => updateDetail('contactName', e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}

function Step14Content() { // Anything Else
    const { sessionId, formData, updateFormData } = useSchoolAdmin();
    return (
        <AdminVoiceInput
            sessionId={sessionId}
            stepNumber={14}
            placeholder="Anything else we should know?"
            initialValue={formData.step14Text}
            onTextChange={(text) => updateFormData({ step14Text: text })}
        />
    );
}


// ── Main Page Component ────────────────────────────────

export default function SchoolAdminStepPage({
    params
}: {
    params: Promise<{ step: string }>
}) {
    // Determine step ID from params
    const stepId = use(params).step;
    const router = useRouter();
    const { sessionId, formData, updateFormData } = useSchoolAdmin();

    // We don't really need localData state anymore since we update formData directly in components now
    // But we might want to capture "current updates" for the save payload?
    // Actually, updateFormData updates the context state. So formData IS the single source of truth.
    // The previous implementation was redundant.

    const currentStepConfig = ADMIN_STEPS.find(s => s.id === stepId);
    if (!currentStepConfig) return <div>Step not found</div>;

    const progress = getAdminProgress(stepId);
    const nextStep = getAdminNextStep(stepId);
    const prevStep = getAdminPrevStep(stepId);

    // Handler for non-voice components to bubble up data
    // Memoized to prevent infinite loops in children effects (though we removed effects, this is still good practice)
    const handleDataChange = useCallback((data: any) => {
        updateFormData(data);
    }, [updateFormData]);

    const handleNext = () => {
        // 1. Navigate IMMEDIATELY — don't wait for save
        if (nextStep) {
            router.push(nextStep.path);
        } else {
            router.push('/school-admin/thank-you');
        }

        // 2. Save in background (fire and forget)
        const payload = {
            sessionId,
            ...formData,
            currentStep: nextStep?.id || stepId,
            isCompleted: stepId === '14',
            surveyType: 'school_admin'
        };

        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(err => console.error('Save failed:', err));
    };

    const handleBack = () => {
        if (prevStep) {
            router.push(prevStep.path);
        } else {
            router.push('/school-admin/email');
        }
    };

    // Render content based on step ID
    const renderContent = () => {
        switch (stepId) {
            case '1': return <Step1Content />;
            case '2': return <Step2Content />;
            case '3': return <Step3Content onNext={handleDataChange} />;
            case '4': return <Step4Content onNext={handleDataChange} />;
            case '5': return <Step5Content onNext={handleDataChange} />;
            case '6': return <Step6Content onNext={handleDataChange} />;
            case '7': return <Step7Content />;
            case '8': return <Step8Content onNext={handleDataChange} />;
            case '9': return <Step9Content onNext={handleDataChange} />;
            case '10': return <Step10Content onNext={handleDataChange} />;
            case '11': return <Step11Content />;
            case '12': return <Step12Content onNext={handleDataChange} />;
            case '13': return <Step13Content onNext={handleDataChange} />;
            case '14': return <Step14Content />;
            default: return <div>Unknown Step</div>;
        }
    };

    // ── Step Validation ────────────────────────────────
    const isStepValid = (): boolean => {
        const data = formData as Record<string, unknown>;
        switch (stepId) {
            case '1': return !!(data.step1Text || data.step1Recording);
            case '2': return !!(data.step2Text || data.step2Recording);
            case '3': return ((formData.schoolIssues as string[])?.length || 0) > 0;
            case '4': return ((formData.issueRanking as string[])?.length || 0) > 0;
            case '5': return ((formData.solutionsTried as string[])?.length || 0) > 0;
            case '6': return Object.keys(formData.solutionEffectiveness || {}).length > 0;
            case '7': return !!(data.step7Text || data.step7Recording);
            case '8': return !!(formData.schoolType || formData.gradeLevel || formData.adminRole);
            case '9': return !!(formData.currentPolicy);
            case '10': return !!(formData.budgetRange);
            case '11': return !!(data.step11Text || data.step11Recording);
            case '12': return !!(formData.pilotInterest);
            case '13': return !!(formData.callInterest);
            case '14': return !!(data.step14Text || data.step14Recording);
            default: return true;
        }
    };

    const stepValid = isStepValid();
    const isLastStep = stepId === '14';

    return (
        <>
            <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <GlassCard className="flex-1 flex flex-col animate-fade-in border-cyan-500/10">
                <div className="mb-8">
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">
                        Step {stepId} of 14
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                        {currentStepConfig.title}
                    </h1>
                    {currentStepConfig.description && (
                        <p className="text-text-secondary text-lg">
                            {currentStepConfig.description}
                        </p>
                    )}
                </div>

                <div className="flex-1 mb-8">
                    {renderContent()}
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8">
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                        {/* Left: Back + Skip */}
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={handleBack}>
                                Back
                            </Button>
                            <button
                                onClick={handleNext}
                                className="px-4 py-2.5 text-base     hover:bg-white/5 rounded-lg text-xs font-medium transition-all underline underline-offset-2"
                            >
                                Skip
                            </button>
                        </div>
                        {/* Right: Continue */}
                        <Button
                            onClick={handleNext}
                            disabled={!stepValid}
                            className={`min-w-[140px] transition-all ${stepValid
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            {isLastStep ? 'Complete Survey' : 'Continue'}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-3">
                        {/* Continue button - prominent at top */}
                        <Button
                            onClick={handleNext}
                            disabled={!stepValid}
                            className={`w-full min-h-[52px] text-lg justify-center transition-all ${stepValid
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            {isLastStep ? 'Complete Survey' : 'Continue'}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>

                        {/* Back and Skip row */}
                        <div className="flex items-center justify-between">
                            <Button variant="secondary" onClick={handleBack} className="text-sm">
                                Back
                            </Button>
                            <button
                                onClick={handleNext}
                                className="px-4 py-2.5 text-white/60 hover:text-white rounded-lg text-sm font-medium transition-all active:scale-95 underline underline-offset-2"
                            >
                                Skip
                            </button>
                        </div>
                    </div>

                    {/* Hint when Continue is disabled */}
                    {!stepValid && (
                        <p className="text-center text-sm text-white/30 mt-3">
                            Please complete this step to continue, or tap Skip.
                        </p>
                    )}
                </div>
            </GlassCard>
        </>
    );
}
