import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - Planning Poker Questions & Answers',
  description: 'Find answers to frequently asked questions about planning poker, agile estimation, and story points.',
  openGraph: {
    title: 'Planning Poker FAQ - Common Questions Answered',
    description: 'Get expert answers to your planning poker and agile estimation questions.',
    type: 'website',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
