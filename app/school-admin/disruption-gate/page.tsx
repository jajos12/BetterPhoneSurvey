'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/survey/ProgressBar'; // Can reuse or make new one
import { useSchoolAdmin } from '@/components/providers/SchoolAdminProvider';
import { DISRUPTION_FREQUENCY_OPTIONS, getAdminProgress } from '@/config/school-admin-steps';

export default function DisruptionGatePage() {
    const router = useRouter();
    const { formData, updateFormData } = useSchoolAdmin();
    const [selected, setSelected] = useState<string | null>(formData.disruptionFrequency || null);

    // Prefetch all possible destinations
    useEffect(() => {
        router.prefetch('/school-admin/email');
        router.prefetch('/school-admin/not-a-fit');
    }, [router]);

    const handleContinue = () => {
        updateFormData({ disruptionFrequency: selected });

        if (selected === 'rarely') {
            // Disqualify / Exit
            router.push('/school-admin/not-a-fit');
        } else {
            router.push('/school-admin/email');
        }
    };

    return (
        <>
            <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${getAdminProgress('disruption-gate')}%` }}
                />
            </div>

            <GlassCard className="flex-1 flex flex-col animate-fade-in border-cyan-500/10">
                <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">
                    Qualification Check
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                    Before we begin...
                </h1>

                <p className="text-text-secondary mb-2">
                    To ensure this survey is relevant for your school:
                </p>

                <p className="text-text-primary font-medium mb-6 text-lg">
                    How often do student phones or personal devices cause disruption or concern at your school?
                </p>

                <RadioGroup
                    name="disruptionFrequency"
                    options={DISRUPTION_FREQUENCY_OPTIONS}
                    value={selected}
                    onChange={setSelected}
                />

                {/* Navigation */}
                <div className="mt-auto pt-8">
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={() => router.push('/school-admin')}>
                                Back
                            </Button>
                            <button
                                onClick={() => router.push('/school-admin/email')}
                                className="px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all underline underline-offset-2"
                            >
                                Skip
                            </button>
                        </div>
                        <Button
                            onClick={handleContinue}
                            disabled={!selected}
                            className={`min-w-[140px] transition-all ${selected
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            Continue
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-3">
                        <Button
                            onClick={handleContinue}
                            disabled={!selected}
                            className={`w-full min-h-[52px] text-lg justify-center transition-all ${selected
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            Continue
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                        <div className="flex items-center justify-between">
                            <Button variant="secondary" onClick={() => router.push('/school-admin')} className="text-sm">
                                Back
                            </Button>
                            <button
                                onClick={() => router.push('/school-admin/email')}
                                className="px-4 py-2.5 text-white/60 hover:text-white rounded-lg text-sm font-medium transition-all active:scale-95 underline underline-offset-2"
                            >
                                Skip
                            </button>
                        </div>
                    </div>

                    {!selected && (
                        <p className="text-center text-sm text-white/30 mt-3">
                            Please select an option to continue, or tap Skip.
                        </p>
                    )}
                </div>
            </GlassCard>
        </>
    );
}
