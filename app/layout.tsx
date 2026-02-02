import { Inter } from 'next/font/google';
import './globals.css';
import { SurveyProvider } from '@/components/providers/SurveyProvider';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BetterPhone Parent Survey | Help Us Build a Better Phone for Kids',
  description: 'Help us build a better phone for kids. Share your experiences as a parent dealing with children\'s technology use.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider>
          <SurveyProvider>
            {children}
          </SurveyProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}

