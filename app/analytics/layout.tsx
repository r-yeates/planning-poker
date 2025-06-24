import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - Sprintro Planning Poker Tool',
  description: 'View real-time analytics and usage statistics for Sprintro planning poker sessions. Track room creation, participant engagement, and voting patterns.',
  robots: 'noindex, nofollow', // Analytics pages typically shouldn't be indexed
  openGraph: {
    title: 'Sprintro Analytics Dashboard',
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
