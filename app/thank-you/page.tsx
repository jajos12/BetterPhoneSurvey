'use client';

import Link from 'next/link';
import { Confetti } from '@/components/ui/Confetti';
import { FloatingElements } from '@/components/ui/FloatingElements';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CondensedThankYouPage() {
    return (
        <>
            <FloatingElements />
            <Confetti />

            <main className="container-survey">
                <div className="min-h-[80vh] flex items-center justify-center">
                    <GlassCard className="max-w-xl w-full text-center animate-fade-in">
                        <div className="stagger-children">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-success/20 rounded-full blur-xl" />
                                <div className="relative w-20 h-20 bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                Thank you!
                            </h1>

                            <p className="text-text-secondary text-lg leading-relaxed mb-4">
                                Your experience matters more than you know. We&apos;re building this for families like yours, and your answers are shaping what comes next.
                            </p>

                            <p className="text-primary font-semibold mb-8">
                                Check your email for your BetterPhone gift card details.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/">
                                    <button className="btn-primary w-full sm:w-auto">
                                        Back to Survey Home
                                    </button>
                                </Link>

                                <Link href="/alt">
                                    <button className="btn-secondary w-full sm:w-auto">
                                        Open Long-Form Survey
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </main>
        </>
    );
}
