import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - Planning Poker Tips & Best Practices',
  description: 'Expert insights on planning poker, agile estimation techniques, and team collaboration best practices.',
  openGraph: {
    title: 'Planning Poker Blog - Expert Tips & Insights',
    description: 'Learn from experts about planning poker, agile estimation, and effective team collaboration.',
    type: 'website',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
