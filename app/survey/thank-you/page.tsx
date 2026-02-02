import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ThankYouPage() {
    return (
        <GlassCard className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-success/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Thank you 🙏
            </h1>

            <p className="text-text-secondary max-w-md mb-8">
                Your answers will directly shape what we build and we really appreciate
                your time. We&apos;re in this together.
            </p>

            <Link href="/" className="text-primary hover:underline">
                Return to homepage
            </Link>
        </GlassCard>
    );
}
