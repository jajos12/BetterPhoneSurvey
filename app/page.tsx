import Link from 'next/link';
import { FloatingElements } from '@/components/ui/FloatingElements';

export default function HomePage() {
  return (
    <>
      {/* Floating Background */}
      <FloatingElements />

      <main className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="max-w-xl w-full">
          <div className="glass-card glass-card-elevated p-8 md:p-10 animate-fade-in">
            <div className="text-center stagger-children">
              {/* Welcome badge */}
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-6 bg-primary/10 px-4 py-2 rounded-full">
                For Parents, By Parents
              </span>

              {/* Headline */}
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight font-[family-name:var(--font-display)]">
                Help Us Build a Better Phone for Kids
              </h1>

              {/* Empathetic intro */}
              <p className="text-text-secondary text-lg mb-4 leading-relaxed">
                We&apos;re a group of parents and child development researchers working
                to create a phone that puts children&apos;s well-being first.
              </p>

              <p className="text-text-secondary mb-8 leading-relaxed">
                Your voice matters. Share your experiences openly, and together,
                we&apos;ll build something that truly serves families like yours.
              </p>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <div className="trust-badge">
                  <span>🔒</span>
                  <span>Anonymous</span>
                </div>
                <div className="trust-badge">
                  <span>⏱️</span>
                  <span>~10 min</span>
                </div>
                <div className="trust-badge">
                  <span>🔐</span>
                  <span>Confidential</span>
                </div>
              </div>

              {/* CTA */}
              <Link href="/survey/pain-check">
                <button className="btn-primary text-lg px-8 py-4">
                  Let&apos;s Begin
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
