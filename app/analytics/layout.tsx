import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - Scrint Planning Poker Tool',
  description: 'View real-time analytics and usage statistics for Scrint planning poker sessions. Track room creation, participant engagement, and voting patterns.',
  robots: 'noindex, nofollow', // Analytics pages typically shouldn't be indexed
  openGraph: {
    title: 'Scrint Analytics Dashboard',
    description: 'Real-time analytics for planning poker sessions',
    type: 'website',
  },
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
