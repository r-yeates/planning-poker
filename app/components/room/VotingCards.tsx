'use client';

import { memo } from 'react';

import { ESTIMATION_SCALES, SCALE_TOOLTIPS } from '@/lib/estimation-scales';
import type { Room } from '@/lib/firebase';

interface VotingCardsProps {
  room: Room;
  userId: string | null;
  selectedCard: number | string | null;
  onVote: (value: number | string) => void;
}

const VotingCards = ({
  room,
  userId,
  selectedCard,
  onVote
}: VotingCardsProps) => {
  // Check if user is spectator
  const isSpectator = userId && room?.participants[userId]?.role === 'spectator';

  return (
    <div className="space-y-4">
      {/* Anonymous Voting Indicator */}
      {room.anonymousVoting && (
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
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">You&apos;re in spectator mode - you can observe but cannot vote</span>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-[#cccccc]">
            {room.votesRevealed ? 'Votes are revealed' : 'Pick your estimate'}
          </h2>
          <div
            role="group"
            aria-label="Your estimate"
            className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2"
          >
            {(() => {
              const currentScale = room.scaleType || 'fibonacci';
              const tooltips = SCALE_TOOLTIPS[currentScale];

              return ESTIMATION_SCALES[currentScale].values.map((value: number | string) => (
                <button
                  key={value}
                  onClick={() => onVote(value)}
                  aria-pressed={selectedCard === value}
                  className={`aspect-[2/3] min-h-[64px] rounded-lg shadow transition-transform border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f0f0f] ${
                    room.votesRevealed
                      ? 'opacity-60 cursor-not-allowed'
                      : 'motion-safe:hover:scale-105'
                  } ${
                    selectedCard === value
                      ? 'bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                      : 'bg-white dark:bg-[#212121] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-white border-gray-200 dark:border-[#404040]'
                  }`}
                  title={room.showTooltips ? tooltips[value] : undefined}
                >
                  <span className="text-xl">{value}</span>
                </button>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(VotingCards);
