import { SurveyProvider } from "@/components/providers/SurveyProvider";

export default function SurveyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Aurora Background */}
            <div className="aurora-bg" aria-hidden="true">
                <div className="aurora-orb aurora-orb-1" />
                <div className="aurora-orb aurora-orb-2" />
                <div className="aurora-orb aurora-orb-3" />
            </div>

            {/* Content */}
            <SurveyProvider>
                <main className="container-survey">
                    {children}
                </main>
            </SurveyProvider>
        </>
    );
}
