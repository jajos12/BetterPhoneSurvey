import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BetterPhone Survey | Help Us Understand Your Family",
  description: "Share your experience with screen time challenges. Your voice helps us build better solutions for families.",
  keywords: ["parenting", "screen time", "children", "digital wellness", "family tech"],
  openGraph: {
    title: "BetterPhone Parent Survey",
    description: "Your perspective matters. Help us understand the challenges families face with screen time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
