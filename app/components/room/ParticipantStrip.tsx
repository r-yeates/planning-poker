'use client';

import { memo, useMemo } from 'react';
import type { Room } from '@/lib/firebase';
import { isParticipantActive } from '@/lib/room-shared';
import { getAvatarColor, getInitials, sortParticipants } from './participant-utils';

interface ParticipantStripProps {
  room: Room;
  userId: string | null;
  /** Current time in ms, used to decide who is away */
  now: number;
}

/**
 * A compact row of avatars with a status dot, so a phone user can see who has voted without
 * scrolling to the People tab. Names are exposed through labels only; the full list lives in the tab.
 */
function ParticipantStrip({ room, userId, now }: ParticipantStripProps) {
  const entries = useMemo(() => sortParticipants(room.participants), [room.participants]);

  return (
    <ul aria-label="Voting status" className="flex gap-3 overflow-x-auto py-1 -mx-1 px-1">
      {entries.map(([id, participant]) => {
        const isSpectator = participant.role === 'spectator';
        const isActive = isParticipantActive(room.presence, id, now);
        const hasVoted = !!room.voted?.[id];
        const vote = room.votes?.[id]?.value;
        const name = room.anonymousVoting ? 'Anonymous' : participant.name;

        let status: string;
        if (isSpectator) status = 'spectating';
        else if (room.votesRevealed) status = vote !== undefined ? `voted ${vote}` : 'did not vote';
        else if (!isActive) status = hasVoted ? 'voted, away' : 'away';
        else status = hasVoted ? 'voted' : 'waiting to vote';

        const dot = isSpectator
          ? 'bg-purple-500 border-white dark:border-[#0f0f0f]'
          : hasVoted
            ? 'bg-green-600 border-white dark:border-[#0f0f0f] text-white'
            : 'bg-white dark:bg-[#212121] border-slate-400 dark:border-[#777777]';

        return (
          <li
            key={id}
            aria-label={`${id === userId ? `${name} (you)` : name}: ${status}`}
            className={`flex shrink-0 flex-col items-center gap-0.5 ${isActive ? '' : 'opacity-60'}`}
          >
            <span className="relative">
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 select-none items-center justify-center rounded-full text-sm font-bold text-white shadow ${getAvatarColor(id)} ${id === userId ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0f0f0f]' : ''}`}
              >
                {room.anonymousVoting ? '?' : getInitials(participant.name)}
              </span>
              <span
                aria-hidden="true"
                className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[0px] ${dot}`}
              >
                {hasVoted && !isSpectator && (
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </span>
            <span aria-hidden="true" className="h-4 text-xs font-bold text-blue-700 dark:text-blue-300">
              {room.votesRevealed && vote !== undefined ? String(vote) : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default memo(ParticipantStrip);
