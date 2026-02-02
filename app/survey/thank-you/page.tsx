import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function ThankYouPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <GlassCard className="max-w-xl w-full text-center animate-fade-in">
                <div className="stagger-children">
                    {/* Success icon with glow */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-success/30 rounded-full blur-xl animate-gentle-pulse" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                        Thank You 🙏
                    </h1>

                    <p className="text-text-secondary text-lg leading-relaxed mb-4">
                        Your voice truly matters. Every answer you shared will directly
                        shape what we build for families like yours.
                    </p>

                    <p className="text-text-muted mb-8">
                        We&apos;re in this together — and we&apos;re grateful you took
                        the time to help.
                    </p>

                    {/* Warm closing */}
                    <div className="p-6 bg-accent/10 rounded-2xl mb-8 border border-accent/20">
                        <p className="text-accent font-medium">
                            &ldquo;The best solutions come from listening to real parents.
                            Thank you for being part of this journey.&rdquo;
                        </p>
                        <p className="text-text-muted text-sm mt-2">
                            — The BetterPhone Team
                        </p>
                    </div>

                    {/* CTA */}
                    <Link href="/">
                        <Button variant="secondary">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
