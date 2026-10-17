import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/site'

export const metadata: Metadata = {
  title: {
    default: 'Blog - Planning Poker Tips & Best Practices',
    template: '%s | Sprintro Blog',
  },
  description: 'Expert insights on planning poker, agile estimation techniques, and team collaboration best practices.',
  openGraph: {
    title: 'Planning Poker Blog - Expert Tips & Insights',
    description: 'Learn from experts about planning poker, agile estimation, and effective team collaboration.',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
