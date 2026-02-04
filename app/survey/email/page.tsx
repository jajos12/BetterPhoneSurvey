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
    const [email, setEmail] = useState(formData.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const hasEmail = email.trim().length > 0;
        updateFormData({ emailOptIn: hasEmail, email: email });

        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    ...formData,
                    emailOptIn: hasEmail,
                    email: email,
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

                    {/* Email Input */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="flex items-center justify-between mb-2">
                                <span className="font-medium text-text-secondary">Your email address</span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted bg-gray-100 px-2 py-0.5 rounded-lg">Optional</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="input-base"
                            />
                            <p className="text-sm text-text-muted mt-3 italic leading-relaxed">
                                Join our community of parents building a better future.
                                We&apos;ll notify you when we&apos;re ready to launch.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4 mt-auto pt-8">
                    <Button variant="secondary" onClick={() => router.push('/survey/step/12')}>
                        Back
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
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
