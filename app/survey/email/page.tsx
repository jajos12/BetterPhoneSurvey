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

        updateFormData({ emailOptIn: optIn, email: optIn ? email : '' });

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
                <div className="stagger-children">
                    {/* Badge */}
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                        One Last Thing
                    </span>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                        Stay Connected
                    </h1>

                    {/* Description */}
                    <p className="text-text-secondary mb-8 text-lg leading-relaxed">
                        We&apos;d love to keep you updated on our progress building the phone
                        you&apos;ve been waiting for. No spam, just meaningful updates.
                    </p>

                    {/* Opt-in checkbox with premium styling */}
                    <div className="space-y-6 mb-8">
                        <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl bg-white/50 border-2 border-transparent hover:border-accent/30 transition-all duration-300">
                            <input
                                type="checkbox"
                                checked={optIn}
                                onChange={(e) => setOptIn(e.target.checked)}
                                className="mt-1 w-6 h-6 cursor-pointer accent-accent rounded"
                            />
                            <div>
                                <span className="text-text-primary font-medium block">
                                    Yes, keep me updated on your progress
                                </span>
                                <span className="text-text-muted text-sm">
                                    Be the first to know when the phone is ready
                                </span>
                            </div>
                        </label>

                        {optIn && (
                            <div className="animate-fade-in">
                                <label className="block font-medium mb-2 text-text-secondary">
                                    Your email address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="input-base"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4 mt-auto pt-8">
                    <Button variant="secondary" onClick={() => router.push('/survey/step/10')}>
                        Back
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleSubmit} disabled={isSubmitting || (optIn && !email)}>
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </span>
                        ) : (
                            <>
                                Complete Survey
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </>
                        )}
                    </Button>
                </div>
            </GlassCard>
        </>
    );
}
