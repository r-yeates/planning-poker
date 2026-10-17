import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms of Service',
  description: 'Read Sprintro\'s privacy policy and terms of service. Learn how we protect your data and what terms apply when using our planning poker tool.',
  robots: 'index, follow',
  openGraph: {
    title: 'Sprintro Privacy Policy & Terms',
    description: 'Privacy policy and terms of service for Sprintro planning poker tool',
    type: 'website',
    url: '/legal',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: '/legal',
  },
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
