import Link from 'next/link';
import { FloatingElements } from '@/components/ui/FloatingElements';

export default function AltSurveyHomePage() {
    return (
        <>
            <FloatingElements />

            <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="max-w-xl w-full">
                    <div className="glass-card glass-card-elevated p-6 sm:p-8 md:p-10 animate-fade-in">
                        <div className="text-center stagger-children">
                            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4 sm:mb-6 bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                                Long-Form Survey
                            </span>

                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4 sm:mb-6 leading-tight font-[family-name:var(--font-display)]">
                                Help Us Build a Better Phone for Kids
                            </h1>

                            <p className="text-text-secondary text-base sm:text-lg mb-3 sm:mb-4 leading-relaxed">
                                This is the original multi-step version with the full question set.
                            </p>

                            <p className="text-text-secondary text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                                The shorter survey now lives on the homepage. This route preserves the legacy flow your boss wanted available as an alternate version.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                                <div className="trust-badge">
                                    <span>12 steps</span>
                                </div>
                                <div className="trust-badge">
                                    <span>Deeper intake</span>
                                </div>
                                <div className="trust-badge">
                                    <span>Legacy flow</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/survey/pain-check">
                                    <button className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                                        Open Long-Form Survey
                                    </button>
                                </Link>

                                <Link href="/">
                                    <button className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                                        Back to Default Survey
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
