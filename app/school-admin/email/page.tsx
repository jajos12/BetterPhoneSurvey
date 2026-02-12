'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useSchoolAdmin } from '@/components/providers/SchoolAdminProvider';
import { getAdminProgress } from '@/config/school-admin-steps';

export default function SchoolAdminEmailPage() {
    const router = useRouter();
    const { sessionId, formData, updateFormData } = useSchoolAdmin();
    const [email, setEmail] = useState(formData.email || '');
    const [optIn, setOptIn] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateEmail = (e: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    };

    const handleSubmit = () => {
        if (!email.trim()) {
            setError('Work email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError(null);
        updateFormData({ emailOptIn: optIn, email: email });

        // Navigate IMMEDIATELY — don't wait for save
        router.push('/school-admin/step/1');

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
                currentStep: 'email',
                surveyType: 'school_admin',
            }),
        }).catch(err => console.error('Save failed:', err));
    };

    return (
        <>
            <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${getAdminProgress('email')}%` }}
                />
            </div>

            <GlassCard className="flex-1 flex flex-col animate-fade-in border-cyan-500/10">
                <div className="stagger-children">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                            Stay Connected
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                        Where should we send information?
                    </h1>

                    <p className="text-text-secondary mb-8 text-lg leading-relaxed">
                        We'll share priority updates about school phone solutions and early access to pilot programs.
                    </p>

                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-text-secondary">Work Email</span>
                                {error && <span className="text-xs font-bold text-red-500 animate-pulse">{error}</span>}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="name@school.edu"
                                className={`input-base focus:border-cyan-500 focus:ring-cyan-500/20 ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                                required
                            />
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                            <div className="relative flex items-center mt-1">
                                <input
                                    type="checkbox"
                                    checked={optIn}
                                    onChange={(e) => setOptIn(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-cyan-500/30 bg-white transition-all checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none"
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
                                <p className="text-sm font-bold text-text-primary group-hover:text-cyan-400 transition-colors">
                                    Send me priority updates & early access
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8">
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={() => router.push('/school-admin/disruption-gate')}>
                                Back
                            </Button>
                            <button
                                onClick={() => { updateFormData({ email: '', emailOptIn: false }); router.push('/school-admin/step/1'); }}
                                className="px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all underline underline-offset-2"
                            >
                                Skip
                            </button>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !email.trim()}
                            className={`min-w-[140px] transition-all ${email.trim()
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    Continue
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !email.trim()}
                            className={`w-full min-h-[52px] text-lg justify-center transition-all ${email.trim()
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    Continue
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </Button>
                        <div className="flex items-center justify-between">
                            <Button variant="secondary" onClick={() => router.push('/school-admin/disruption-gate')} className="text-sm">
                                Back
                            </Button>
                            <button
                                onClick={() => { updateFormData({ email: '', emailOptIn: false }); router.push('/school-admin/step/1'); }}
                                className="px-4 py-2.5 text-white/60 hover:text-white rounded-lg text-sm font-medium transition-all active:scale-95 underline underline-offset-2"
                            >
                                Skip
                            </button>
                        </div>
                    </div>

                    {!email.trim() && (
                        <p className="text-center text-sm text-white/30 mt-3">
                            Enter your email to continue, or tap Skip.
                        </p>
                    )}
                </div>
            </GlassCard>
        </>
    );
}
