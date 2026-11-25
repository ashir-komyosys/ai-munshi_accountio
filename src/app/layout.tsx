import type { Metadata } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Orbitron,
  Noto_Sans_Arabic,
} from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/common/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["600", "700"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Accountio AI | AI Munshi — Accounting as a Conversation",
  description:
    "Conversational accounting web application for Pakistani shopkeepers, traders, wholesalers, and small businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} ${orbitron.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg-app)] text-[var(--text-primary)]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
