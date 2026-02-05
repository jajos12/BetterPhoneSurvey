'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useSurvey } from '@/components/providers/SurveyProvider';

type PageState = 'initial' | 'referral' | 'exit';

export default function NotAFitPage() {
    const { sessionId, formData, updateFormData } = useSurvey();
    const [state, setState] = useState<PageState>('initial');

    const saveResponse = async (updates: any) => {
        try {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    ...formData,
                    ...updates,
                    isCompleted: true,
                    currentStep: 'not-a-fit'
                }),
            });
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    const handleYes = () => {
        const updates = { knowsOthersWithStress: true };
        updateFormData(updates);
        saveResponse(updates);
        setState('referral');
    };

    const handleNo = () => {
        const updates = { knowsOthersWithStress: false };
        updateFormData(updates);
        saveResponse(updates);
        setState('exit');
    };

    const handleShare = () => {
        const text = `Looks like something you would be interested in:\n${window.location.origin}`;

        if (navigator.share) {
            navigator.share({
                title: 'BetterPhone Survey',
                text: 'Looks like something you would be interested in:',
                url: window.location.origin
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert('Link copied to clipboard!');
        }
    };

    if (state === 'initial') {
        return (
            <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
                    Thanks for your honesty!
                </h1>

                <p className="text-lg text-text-secondary mb-8 max-w-md">
                    Do you perhaps know anyone who has regular stressors with their kids due to their kids&apos; usage of technology?
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <Button className="flex-1 py-6 text-lg" onClick={handleYes}>
                        Yes, I do
                    </Button>
                    <Button variant="secondary" className="flex-1 py-6 text-lg" onClick={handleNo}>
                        No, not really
                    </Button>
                </div>
            </GlassCard>
        );
    }

    if (state === 'referral') {
        return (
            <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                    That&apos;s great!
                </h1>

                <p className="text-text-secondary mb-8 max-w-md text-center">
                    We&apos;d love if you shared this survey with them. Both you and they will receive a <strong className="text-text-primary">$100 gift card</strong> upon completion.
                </p>

                <div className="space-y-4 w-full max-w-sm">
                    <Button className="w-full py-6 text-lg gap-3" onClick={handleShare}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Survey Link
                    </Button>
                    <Link href="/" className="block">
                        <Button variant="secondary" className="w-full">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Thank you!
            </h1>

            <p className="text-text-secondary mb-8 max-w-md">
                We appreciate you taking a moment to check. We&apos;re building something special
                for families, and your input matters.
            </p>

            <Link href="/">
                <Button variant="secondary">
                    Return Home
                </Button>
            </Link>
        </GlassCard>
    );
}
