import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <GlassCard className="animate-fade-in">
          <div className="text-center stagger-children">
            {/* Welcome badge */}
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-4 bg-accent/10 px-4 py-2 rounded-full">
              For Parents, By Parents
            </span>

            {/* Headline */}
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
              Help Us Build a Better Phone for Kids
            </h1>

            {/* Empathetic intro */}
            <p className="text-text-secondary text-lg mb-4 leading-relaxed">
              We&apos;re a group of parents and child development researchers working
              to create a phone that puts children&apos;s well-being first — one that
              understands the real challenges you face every day.
            </p>

            <p className="text-text-secondary mb-8 leading-relaxed">
              Your voice matters. Share your experiences openly, and together,
              we&apos;ll build something that truly serves families like yours.
            </p>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <span>Private & Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span>~10 minutes</span>
              </div>
            </div>

            {/* CTA */}
            <Link href="/survey/pain-check">
              <Button size="lg">
                Let&apos;s Begin
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
