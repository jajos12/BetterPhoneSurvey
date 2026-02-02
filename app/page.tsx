import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <GlassCard className="animate-fade-in">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              Welcome
            </span>

            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
              Help Us Build a Better Phone for Kids
            </h1>

            <p className="text-text-secondary text-lg mb-4 leading-relaxed">
              We&apos;re a group of parents and child development researchers working to create
              a phone that puts children&apos;s development and well-being first — one that
              thoughtfully accounts for technology&apos;s real impact on children&apos;s minds.
            </p>

            <p className="text-text-secondary mb-8 leading-relaxed">
              Please take a few minutes to share your experiences so we can build something
              that truly serves families.
            </p>

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
