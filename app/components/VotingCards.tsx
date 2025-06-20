'use client';

import { ESTIMATION_SCALES, SCALE_TOOLTIPS } from '@/lib/estimation-scales';
import type { Room } from '@/lib/firebase';

interface VotingCardsProps {
  room: Room;
  userId: string | null;
  selectedCard: number | string | null;
  onVote: (value: number | string) => void;
}

export default function VotingCards({
  room,
  userId,
  selectedCard,
  onVote
}: VotingCardsProps) {
  // Check if user is spectator
  const isSpectator = userId && room?.participants[userId]?.role === 'spectator';

  return (
    <>
      {/* Anonymous Voting Indicator */}
      {room.anonymousVoting && !room.votesRevealed && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium">Anonymous voting is active - participant names are hidden</span>
          </div>
        </div>
      )}

      {/* Voting Cards or Spectator Message */}
      {isSpectator ? (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-6 rounded-lg text-center">
          <div className="text-2xl mb-2">👁️</div>
          <h3 className="text-base font-semibold text-purple-700 dark:text-purple-300 mb-2">
            You're in Spectator Mode
          </h3>
          <p className="text-purple-600 dark:text-purple-400 text-sm">
            You can observe the voting process but cannot participate. Click the toggle above to switch back to voting mode.
          </p>
        </div>
      ) : (        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
          {(() => {
            const currentScale = room.scaleType || 'fibonacci';
            const tooltips = SCALE_TOOLTIPS[currentScale];
            
            return ESTIMATION_SCALES[currentScale].values.map((value: number | string) => (
              <button
                key={value}
                onClick={() => onVote(value)}
                className={`aspect-[2/3] rounded-lg shadow transition-transform hover:scale-105 border ${
                  selectedCard === value
                    ? 'bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
                }`}
                title={room.showTooltips ? tooltips[value] : undefined}
              >
                <span className="text-xl">{value}</span>
              </button>
            ));
          })()}
        </div>
      )}
    </>
  );
}
