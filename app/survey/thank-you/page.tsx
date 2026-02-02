'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Confetti } from '@/components/ui/Confetti';

export default function ThankYouPage() {
    const [copied, setCopied] = useState(false);
    const surveyUrl = typeof window !== 'undefined' ? window.location.origin : 'https://survey.betterphone.co';

    const handleShare = async () => {
        const shareData = {
            title: 'BetterPhone Survey',
            text: 'Help build a phone that puts kids\' well-being first. Share your experience!',
            url: surveyUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled', err);
            }
        } else {
            // Fallback to copy link
            await navigator.clipboard.writeText(surveyUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Confetti />
            <div className="min-h-[80vh] flex items-center justify-center">
                <GlassCard className="max-w-xl w-full text-center animate-fade-in">
                    <div className="stagger-children">
                        {/* Success icon */}
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        {/* Message */}
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Thank You! 🎉
                        </h1>

                        <p className="text-text-secondary text-lg leading-relaxed mb-4">
                            Your voice truly matters. Every answer you shared will directly
                            shape what we build for families like yours.
                        </p>

                        <p className="text-text-muted mb-8">
                            We&apos;re in this together — and we&apos;re grateful you took
                            the time to help.
                        </p>

                        {/* Share section */}
                        <div className="p-6 bg-primary/5 rounded-2xl mb-6 border border-primary/10">
                            <p className="text-text-secondary font-medium mb-4">
                                Know other parents struggling with screen time?
                            </p>

                            <button
                                onClick={handleShare}
                                className="share-button mx-auto"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                {copied ? 'Link Copied!' : 'Share This Survey'}
                            </button>

                            <p className="text-text-muted text-sm mt-4">
                                We&apos;d love if you shared with friends or family facing similar challenges with their kids&apos; technology usage.
                            </p>
                        </div>

                        {/* Return home */}
                        <Link href="/">
                            <button className="btn-secondary">
                                Return Home
                            </button>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </>
    );
}
