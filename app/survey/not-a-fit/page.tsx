'use client';

import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function NotAFitPage() {
    return (
        <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Thanks for stopping by!
            </h1>

            <p className="text-text-secondary mb-8 max-w-md">
                It sounds like this survey might not be the right fit for you right now,
                but we&apos;d love to stay connected. We&apos;re building something special
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
