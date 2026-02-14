'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { useSurvey } from '@/components/providers/SurveyProvider';

export default function EmailPage() {
    const router = useRouter();
    const { sessionId, formData, updateFormData } = useSurvey();
    const [email, setEmail] = useState(formData.email || '');
    const [optIn, setOptIn] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Prefetch next + back destinations
    useEffect(() => {
        router.prefetch('/survey/step/1');
        router.prefetch('/survey/pain-check');
    }, [router]);

    const validateEmail = (e: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    };

    const handleSubmit = () => {
        if (!email.trim()) {
            setError('Email is required to receive your $100 gift card');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError(null);
        updateFormData({ emailOptIn: optIn, email: email });

        // Navigate IMMEDIATELY — don't wait for save
        router.push('/survey/step/1');

        // Save in background (fire and forget)
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                ...formData,
                emailOptIn: optIn,
                email: email,
                isCompleted: false,
                currentStep: 'email'
            }),
        }).catch(err => console.error('Save failed:', err));
    };

    return (
        <>
            <ProgressBar currentStepId="email" />

            <GlassCard className="flex-1 flex flex-col animate-fade-in">
                <div className="stagger-children">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            Claim Reward
                        </span>
                        <span className="text-xl">🎁</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                        Where should we send your $100 gift card?
                    </h1>

                    {/* Description */}
                    <p className="text-text-secondary mb-8 text-lg leading-relaxed">
                        To receive your <strong className="text-text-primary">$100 BetterPhone Gift Card</strong>, we just need your email address to send the delivery details.
                    </p>

                    {/* Email Input */}
                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-text-secondary">Your Delivery Email</span>
                                {error && <span className="text-xs font-bold text-red-500 animate-pulse">{error}</span>}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="name@email.com"
                                className={`input-base ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                                required
                            />
                        </div>

                        {/* Opt-in Checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all">
                            <div className="relative flex items-center mt-1">
                                <input
                                    type="checkbox"
                                    checked={optIn}
                                    onChange={(e) => setOptIn(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-primary/30 bg-white transition-all checked:bg-primary checked:border-primary focus:outline-none"
                                />
                                <svg
                                    className="pointer-events-none absolute h-5 w-5 pb-0.5 text-white opacity-0 peer-checked:opacity-100"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                                    Send me priority updates & early access
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Get notified when we launch and join the community of parents.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4 mt-auto pt-8">
                    <Button variant="secondary" onClick={() => router.push('/survey/pain-check')}>
                        Back
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleSubmit} className="px-8 flex items-center gap-3">
                        Claim My $100 Reward
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Button>
                </div>
            </GlassCard>
        </>
    );
}
