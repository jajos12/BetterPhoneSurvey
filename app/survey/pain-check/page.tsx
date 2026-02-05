'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { useSurvey } from '@/components/providers/SurveyProvider';
import type { PainCheckValue } from '@/types/survey';

const options = [
    { value: 'crisis', label: 'Crisis Level - I need a solution immediately' },
    { value: 'yes', label: 'Yes, this is a regular source of stress and problems' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'no', label: 'No' },
];

export default function PainCheckPage() {
    const router = useRouter();
    const { formData, updateFormData } = useSurvey();
    const [selected, setSelected] = useState<string | null>(formData.painCheck || null);

    const handleContinue = () => {
        updateFormData({ painCheck: selected as PainCheckValue });

        if (selected === 'no') {
            router.push('/survey/not-a-fit');
        } else {
            router.push('/survey/step/1');
        }
    };

    return (
        <>
            <ProgressBar currentStepId="pain-check" />

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                    Quick Check
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                    Before we continue...
                </h1>

                <p className="text-text-secondary mb-2">
                    We need to make sure this survey is right for you:
                </p>

                <p className="text-text-primary font-medium mb-6">
                    Is your child&apos;s relationship with their phone/device causing you significant
                    stress or concern on at least a daily or weekly basis?
                </p>

                <RadioGroup
                    name="painCheck"
                    options={options}
                    value={selected}
                    onChange={setSelected}
                />

                <div className="flex gap-4 mt-auto pt-8">
                    <Button variant="secondary" onClick={() => router.push('/')}>
                        Back
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleContinue} disabled={!selected}>
                        Continue
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Button>
                </div>
            </GlassCard>
        </>
    );
}
