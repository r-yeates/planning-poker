import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/global/ThemeProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Share images come from app/opengraph-image.tsx and app/twitter-image.tsx.
// Google Search Console is verified by public/googlecd7dcc3683278b94.html, so no verification meta tag is needed.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free Planning Poker & Scrum Poker Online | Sprintro",
    template: "%s | Sprintro",
  },
  description: "Free planning poker (scrum poker) for agile teams. Estimate story points in real time with Fibonacci or T-shirt scales, anonymous voting and no signup.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // No canonical here: child pages would inherit it and point at the home page. Each page sets its own.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: "Free Planning Poker for Agile Teams | Sprintro",
    description: "Real-time planning poker for scrum teams. Estimate story points together with anonymous voting. No signup, start in 30 seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Planning Poker for Agile Teams | Sprintro",
    description: "Real-time scrum poker for agile estimation. No signup required.",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
