import { SurveyProvider } from '@/components/providers/SurveyProvider';
import { FloatingElements } from '@/components/ui/FloatingElements';
import {
    CONDENSED_SESSION_KEY,
    CONDENSED_SESSION_PREFIX,
    CONDENSED_STORAGE_KEY,
    CONDENSED_VARIANT,
} from '@/config/condensed-parent-survey';

export default function CondensedSurveyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <FloatingElements />

            <SurveyProvider
                storageKey={CONDENSED_STORAGE_KEY}
                sessionKey={CONDENSED_SESSION_KEY}
                sessionPrefix={CONDENSED_SESSION_PREFIX}
                initialData={{ surveyVariant: CONDENSED_VARIANT }}
            >
                <main className="container-survey">
                    {children}
                </main>
            </SurveyProvider>
        </>
    );
}
