import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scrint - Planning Poker Tool for Agile Teams | Free Story Point Estimation",
  description: "Free online planning poker tool for agile teams. Estimate user stories, eliminate bias, and reach consensus faster. No signup required - start in 30 seconds.",
  keywords: [
    "planning poker",
    "agile estimation", 
    "story points",
    "scrum",
    "sprint planning",
    "team estimation",
    "fibonacci",
    "agile tools",
    "scrint",
    "free planning poker"
  ],
  authors: [{ name: "Scrint" }],
  creator: "Scrint",
  publisher: "Scrint",
  robots: "index, follow",
  metadataBase: new URL("https://scrint.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Scrint - Planning Poker Tool for Agile Teams",
    description: "Free online planning poker tool for agile teams. Estimate user stories and reach consensus faster. No signup required.",
    url: "https://scrint.dev",
    siteName: "Scrint",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scrint Planning Poker Tool - Agile Estimation for Teams",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrint - Planning Poker Tool for Agile Teams",
    description: "Free online planning poker tool for agile teams. Start estimating in 30 seconds.",
    images: ["/og-image.png"],
    creator: "@scrint",
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual code
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "Technology",
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
