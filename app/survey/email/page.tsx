'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { useSurvey } from '@/components/providers/SurveyProvider';

export default function EmailPage() {
    const router = useRouter();
    const { sessionId, formData, updateFormData } = useSurvey();
    const [optIn, setOptIn] = useState(formData.emailOptIn || false);
    const [email, setEmail] = useState(formData.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Update form data
        updateFormData({ emailOptIn: optIn, email: optIn ? email : '' });

        // Save to Supabase via API route
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    ...formData,
                    emailOptIn: optIn,
                    email: optIn ? email : '',
                    isCompleted: true,
                }),
            });

            if (!response.ok) {
                console.error('Save failed:', await response.text());
            }
        } catch (error) {
            console.error('Save failed:', error);
        }

        router.push('/survey/thank-you');
    };

    return (
        <>
            <ProgressBar currentStepId="email" />

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                    Almost Done
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                    Stay Connected
                </h1>

                <p className="text-text-secondary mb-6">
                    We&apos;d love to keep you updated on our progress building the phone
                    you&apos;ve been waiting for.
                </p>

                <div className="space-y-4 mb-8">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={optIn}
                            onChange={(e) => setOptIn(e.target.checked)}
                            className="mt-1 w-5 h-5 cursor-pointer"
                        />
                        <span className="text-text-primary">
                            Yes, keep me updated on your progress
                        </span>
                    </label>

                    {optIn && (
                        <div className="animate-fade-in">
                            <label className="block font-medium mb-2">
                                Your email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="input-base"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mt-auto pt-8">
                    <Button variant="secondary" onClick={() => router.push('/survey/step/10')}>
                        Back
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                        {!isSubmitting && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </Button>
                </div>
            </GlassCard>
        </>
    );
}
