'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useSchoolAdmin } from '@/components/providers/SchoolAdminProvider';
import confetti from 'canvas-confetti';

export default function ThankYouPage() {
    const router = useRouter();
    const { sessionId, formData } = useSchoolAdmin();

    useEffect(() => {
        // Fire confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        // Mark as completed in DB
        const completeSurvey = async () => {
            try {
                await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        ...formData,
                        isCompleted: true,
                        currentStep: 'thank-you',
                        surveyType: 'school_admin'
                    }),
                });
            } catch (err) {
                console.error(err);
            }
        };

        if (sessionId) completeSurvey();

        return () => clearInterval(interval);
    }, [sessionId, formData]);

    return (
        <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in border-cyan-500/10">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center text-4xl mb-6">
                ✨
            </div>

            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                Thank You
            </h1>

            <p className="text-xl text-text-primary mb-4 font-medium">
                Your insights are invaluable.
            </p>

            <p className="text-text-secondary max-w-md mx-auto mb-10 leading-relaxed">
                We'll use this data to shape how we support schools dealing with these challenges. We'll be in touch soon with research findings and information about our pilot programs.
            </p>

            <Button onClick={() => window.location.href = 'https://betterphone.org'} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8">
                Return to Website
            </Button>
        </GlassCard>
    );
}
