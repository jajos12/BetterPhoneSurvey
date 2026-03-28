'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingElements } from '@/components/ui/FloatingElements';
import {
    CONDENSED_SESSION_KEY,
    CONDENSED_SESSION_PREFIX,
    CONDENSED_STORAGE_KEY,
    CONDENSED_VARIANT,
} from '@/config/condensed-parent-survey';
import { getSessionId } from '@/lib/utils';

export default function HomePage() {
    const router = useRouter();
    const [email, setEmail] = useState(() => {
        if (typeof window === 'undefined') {
            return '';
        }

        const saved = localStorage.getItem(CONDENSED_STORAGE_KEY);
        if (!saved) {
            return '';
        }

        try {
            const parsed = JSON.parse(saved) as { email?: string };
            return parsed.email || '';
        } catch (parseError) {
            console.error('Failed to parse condensed survey data:', parseError);
            return '';
        }
    });
    const [error, setError] = useState<string | null>(null);

    const handleStart = () => {
        const trimmedEmail = email.trim();
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

        if (!trimmedEmail) {
            setError('Email is required so we know where to send your gift card.');
            return;
        }

        if (!isValidEmail) {
            setError('Please enter a valid email address.');
            return;
        }

        getSessionId(CONDENSED_SESSION_PREFIX, CONDENSED_SESSION_KEY);
        const existing = localStorage.getItem(CONDENSED_STORAGE_KEY);
        let existingData: Record<string, unknown> = {};

        if (existing) {
            try {
                existingData = JSON.parse(existing) as Record<string, unknown>;
            } catch (parseError) {
                console.error('Failed to parse stored condensed survey data:', parseError);
            }
        }

        localStorage.setItem(
            CONDENSED_STORAGE_KEY,
            JSON.stringify({
                ...existingData,
                email: trimmedEmail,
                surveyVariant: CONDENSED_VARIANT,
            })
        );

        router.push('/step/1');
    };

    return (
        <>
            <FloatingElements />

            <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="max-w-xl w-full">
                    <div className="glass-card glass-card-elevated p-6 sm:p-8 md:p-10 animate-fade-in">
                        <div className="text-center stagger-children">
                            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4 sm:mb-6 bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                                For Parents, By Parents
                            </span>

                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4 sm:mb-6 leading-tight font-[family-name:var(--font-display)]">
                                Help Us Build a Better Phone for Kids
                            </h1>

                            <div className="inline-flex items-center gap-2 text-primary font-bold mb-6 bg-primary/5 px-6 py-3 rounded-2xl border-2 border-primary/20 shadow-sm">
                                <span>Complete the survey for a $100 BetterPhone Gift Card</span>
                            </div>

                            <p className="text-text-secondary text-base sm:text-lg mb-3 sm:mb-4 leading-relaxed">
                                We&apos;re a group of parents and child development researchers working to create a phone that puts children&apos;s well-being first.
                            </p>

                            <p className="text-text-secondary text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                                This is the new condensed version from the reference HTML, rebuilt on top of the live app so we keep the real save flow, voice capture, and admin visibility.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                                <div className="trust-badge">
                                    <span>~1 minute</span>
                                </div>
                                <div className="trust-badge">
                                    <span>Confidential</span>
                                </div>
                                <div className="trust-badge">
                                    <span>Voice-friendly</span>
                                </div>
                            </div>

                            <div className="text-left mb-6">
                                <label className="block font-semibold text-text-secondary mb-2">
                                    Your delivery email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        if (error) {
                                            setError(null);
                                        }
                                    }}
                                    placeholder="name@email.com"
                                    className={`input-base ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                                />
                                <p className="text-xs text-text-muted mt-2 text-center">
                                    We use this to send your gift card after you finish.
                                </p>
                                {error && (
                                    <p className="text-sm text-red-500 mt-3 text-center font-semibold">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={handleStart}
                                    className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
                                >
                                    Let&apos;s Begin
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>

                                <Link href="/alt">
                                    <button className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                                        Open Long-Form Version
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
