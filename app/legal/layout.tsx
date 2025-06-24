import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms of Service - Sprintro',
  description: 'Read Sprintro\'s privacy policy and terms of service. Learn how we protect your data and what terms apply when using our planning poker tool.',
  robots: 'index, follow',
  openGraph: {
    title: 'Sprintro Privacy Policy & Terms',
    description: 'Privacy policy and terms of service for Sprintro planning poker tool',
    type: 'website',
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
