import Link from 'next/link';

export default function SchoolAdminIntroPage() {
    return (
        <div className="min-h-[80dvh] flex items-center justify-center p-4 sm:p-6 relative z-10">
            <div className="max-w-xl w-full">
                <div className="glass-card glass-card-elevated p-6 sm:p-8 md:p-10 animate-fade-in border-cyan-500/10">
                    <div className="text-center stagger-children">
                        {/* Welcome badge */}
                        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4 sm:mb-6 bg-cyan-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-cyan-500/20">
                            For School Leaders
                        </span>

                        {/* Headline */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4 sm:mb-6 leading-tight font-[family-name:var(--font-display)]">
                            Help Shape the Future of Student Safety
                        </h1>

                        {/* Value prop badge */}
                        <div className="inline-flex items-center gap-2 text-cyan-400 font-bold mb-6 bg-cyan-500/5 px-6 py-3 rounded-2xl border-2 border-cyan-500/20 shadow-sm">
                            <span className="text-xl">🏫</span>
                            <span>Pilot program access for qualifying schools</span>
                        </div>

                        {/* Intro copy */}
                        <p className="text-text-secondary text-base sm:text-lg mb-3 sm:mb-4 leading-relaxed">
                            We&apos;re building technology that helps schools manage student device
                            use while keeping kids safe and focused.
                        </p>

                        <p className="text-text-secondary text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                            Your firsthand experience with phone-related disruptions is invaluable.
                            Share your challenges, and help us design a solution that truly works
                            for administrators, teachers, and students.
                        </p>

                        {/* Trust indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                            <div className="trust-badge">
                                <span>🔒</span>
                                <span>Confidential</span>
                            </div>
                            <div className="trust-badge">
                                <span>⏱️</span>
                                <span>~5 min</span>
                            </div>
                            <div className="trust-badge">
                                <span>📊</span>
                                <span>Data-Driven</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <Link href="/school-admin/disruption-gate">
                            <button className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 border-cyan-500/30">
                                Get Started
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
