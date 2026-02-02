import { SurveyProvider } from "@/components/providers/SurveyProvider";
import { FloatingElements } from "@/components/ui/FloatingElements";

export default function SurveyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Floating Background */}
            <FloatingElements />

            {/* Content */}
            <SurveyProvider>
                <main className="container-survey">
                    {children}
                </main>
            </SurveyProvider>
        </>
    );
}
