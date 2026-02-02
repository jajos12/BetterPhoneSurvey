import { ProgressBar } from '@/components/survey/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SurveyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">
            {children}
        </main>
    );
}
