import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'FAQ - Planning Poker Questions & Answers',
  description: 'Find answers to frequently asked questions about planning poker, agile estimation, and story points.',
  openGraph: {
    title: 'Planning Poker FAQ - Common Questions Answered',
    description: 'Get expert answers to your planning poker and agile estimation questions.',
    type: 'website',
    url: '/faq',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: '/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
