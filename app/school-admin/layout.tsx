import { SchoolAdminProvider } from "@/components/providers/SchoolAdminProvider";
import { FloatingElements } from "@/components/ui/FloatingElements";

export default function SchoolAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Same floating background for consistency */}
            <FloatingElements />

            {/* Content wrapped in School Admin Provider */}
            <SchoolAdminProvider>
                <main className="container-survey">
                    {children}
                </main>
            </SchoolAdminProvider>
        </>
    );
}
