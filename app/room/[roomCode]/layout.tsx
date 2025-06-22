import { Metadata } from 'next'

type Props = {
  params: Promise<{ roomCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomCode } = await params

  return {
    title: `Planning Poker Room ${roomCode} - Scrint`,
    description: `Join planning poker estimation session ${roomCode}. Collaborative story point estimation for agile teams using Scrint.`,
    robots: 'noindex, nofollow', // Rooms shouldn't be indexed by search engines
    openGraph: {
      title: `Planning Poker Room ${roomCode}`,
      description: `Join our agile estimation session and help estimate story points collaboratively.`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `Join Planning Poker Room ${roomCode}`,
      description: 'Collaborative agile estimation session in progress.',
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
