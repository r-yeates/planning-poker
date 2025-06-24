import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/global/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sprintro - Planning Poker Tool for Agile Teams | Free Story Point Estimation",
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
    "Sprintro",
    "free planning poker"
  ],
  authors: [{ name: "Sprintro" }],
  creator: "Sprintro",
  publisher: "Sprintro",
  robots: "index, follow",
  metadataBase: new URL("https://Sprintro.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sprintro - Planning Poker Tool for Agile Teams",
    description: "Free online planning poker tool for agile teams. Estimate user stories and reach consensus faster. No signup required.",
    url: "https://Sprintro.dev",
    siteName: "Sprintro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sprintro Planning Poker Tool - Agile Estimation for Teams",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sprintro - Planning Poker Tool for Agile Teams",
    description: "Free online planning poker tool for agile teams. Start estimating in 30 seconds.",
    images: ["/og-image.png"],
    creator: "@Sprintro",
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
