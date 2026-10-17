'use client';

import { memo, useMemo } from 'react';
import type { Room } from '@/lib/firebase';
import { isParticipantActive } from '@/lib/room-shared';
import ParticipantCard from './ParticipantCard';
import { sortParticipants } from './participant-utils';

interface ParticipantListProps {
  room: Room;
  userId: string | null;
  isAdmin: boolean;
  /** Current time in ms, used to decide who is away */
  now: number;
  onKick: (participantId: string) => void;
  onMakeHost: (participantId: string) => void;
  onClearVote: (participantId: string) => void;
}

/** Host first, then alphabetical by name — a stable order that doesn't jump around as people vote. */
function ParticipantList({ room, userId, isAdmin, now, onKick, onMakeHost, onClearVote }: ParticipantListProps) {
  const entries = useMemo(() => sortParticipants(room.participants), [room.participants]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-[#f1f1f1] flex items-center gap-2">
          <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
          </svg>
          Participants ({entries.length})
        </h3>
      </div>
      <div className="space-y-3">
        {entries.map(([id, participant]) => (
          <ParticipantCard
            key={id}
            participantId={id}
            participant={participant}
            vote={room.votes?.[id]?.value}
            hasVoted={!!room.voted?.[id]}
            isActive={isParticipantActive(room.presence, id, now)}
            isCurrentUser={id === userId}
            isAdmin={isAdmin}
            votesRevealed={room.votesRevealed}
            anonymousVoting={room.anonymousVoting}
            onKick={onKick}
            onMakeHost={onMakeHost}
            onClearVote={onClearVote}
            isHost={participant.isHost}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(ParticipantList);
