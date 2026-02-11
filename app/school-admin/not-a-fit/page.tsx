'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function NotAFitPage() {
    return (
        <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6 opacity-50">
                👋
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Thanks for your interest
            </h1>

            <p className="text-text-secondary max-w-md mx-auto mb-10 leading-relaxed">
                BetterPhone is specifically designed for schools actively struggling with device-related disruptions. Since this isn't a major issue for your campus right now, our pilot program wouldn't be the best fit.
            </p>

            <p className="text-text-secondary max-w-md mx-auto mb-10 text-sm">
                We appreciate you taking the time to check.
            </p>

            <Button onClick={() => window.location.href = 'https://betterphone.org'}>
                Return to Website
            </Button>
        </GlassCard>
    );
}
