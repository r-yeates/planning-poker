import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/site'

type Props = {
  params: Promise<{ roomCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomCode } = await params

  return {
    title: { absolute: `Planning Poker Room ${roomCode} | Sprintro` },
    description: `Join planning poker estimation session ${roomCode}. Collaborative story point estimation for agile teams using Sprintro.`,
    // Rooms are private, short-lived sessions. robots.ts deliberately does NOT block /room/,
    // otherwise crawlers could never read this noindex and shared links could still be listed.
    robots: { index: false, follow: false },
    openGraph: {
      title: `Planning Poker Room ${roomCode}`,
      description: `Join our agile estimation session and help estimate story points collaboratively.`,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Join Planning Poker Room ${roomCode}`,
      description: 'Collaborative agile estimation session in progress.',
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
