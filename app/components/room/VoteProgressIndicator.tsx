'use client';

import { useState, useEffect, memo } from 'react';
import type { Room } from '@/lib/firebase';
import { getActiveVoterIds } from '@/lib/room-shared';

interface VoteProgressIndicatorProps {
  room: Room;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const VoteProgressIndicator = ({
  room,
  className = '',
  showDetails = true,
  compact = false
}: VoteProgressIndicatorProps) => {
  // Round timer: derived from the room's server-side start/end timestamps so every client agrees.
  // Rooms created before these fields existed simply show no timer.
  const roundStartedAt = room.roundStartedAt;
  const roundEndedAt = room.roundEndedAt;
  const isRoundActive = typeof roundStartedAt === 'number' && !room.votesRevealed;
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!isRoundActive) return;
    setTick(Date.now());
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRoundActive, roundStartedAt]);

  const roundElapsedTime =
    typeof roundStartedAt === 'number'
      ? Math.max(0, Math.floor(((room.votesRevealed ? roundEndedAt ?? tick : tick) - roundStartedAt) / 1000))
      : 0;

  // Calculate voting stats excluding spectators
  const voterIds = getActiveVoterIds(room);
  const voterCount = voterIds.length;
  const votedCount = voterIds.filter((id) => room?.voted?.[id]).length;
  const allVotersHaveVoted = voterCount > 0 && votedCount === voterCount;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show if no voters
  if (voterCount === 0) {
    return null;
  }

  const progressPercentage = voterCount > 0 ? (votedCount / voterCount) * 100 : 0;

  // Compact version for use in admin panel or tight spaces
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-[#aaaaaa]">
              {room.votesRevealed ? 'Voting Results' : 'Voting Progress'}
            </span>
            <div className="flex items-center gap-3">
              {/* Round Timer */}
              {(isRoundActive || (room.votesRevealed && typeof roundStartedAt === 'number')) && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[#3b82f6] dark:text-[#3b82f6] font-mono text-xs">
                    {formatTime(roundElapsedTime)}
                  </span>
                </div>
              )}
              <span className={`font-bold ${
                room.votesRevealed || allVotersHaveVoted 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-slate-600 dark:text-[#aaaaaa]'
              }`}>
                {votedCount}/{voterCount}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#404040] rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                room.votesRevealed || allVotersHaveVoted 
                  ? 'bg-green-500 dark:bg-green-400' 
                  : 'bg-[#3b82f6] dark:bg-[#3b82f6]'
              }`}
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={votedCount}
              aria-valuemin={0}
              aria-valuemax={voterCount}
              aria-label={`${votedCount} of ${voterCount} participants have voted`}
            />
          </div>
        </div>
        {(room.votesRevealed || allVotersHaveVoted) && (
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-[#212121] rounded-lg shadow border border-slate-200 dark:border-[#404040] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {room.votesRevealed ? 'Voting Results' : 'Voting Progress'}
        </h3>
        <div className="flex items-center gap-4">
          {/* Round Timer */}
          {(isRoundActive || (room.votesRevealed && typeof roundStartedAt === 'number')) && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-slate-600 dark:text-[#aaaaaa]">Round:</span>
              <span className="text-sm font-mono font-semibold text-[#3b82f6] dark:text-[#3b82f6]">
                {formatTime(roundElapsedTime)}
              </span>
            </div>
          )}
          <div className={`text-sm font-bold transition-colors duration-200 ${
            room.votesRevealed || allVotersHaveVoted 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-slate-600 dark:text-[#aaaaaa]'
          }`}>
            {votedCount}/{voterCount}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-slate-200 dark:bg-[#404040] rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              room.votesRevealed || allVotersHaveVoted 
                ? 'bg-green-500 dark:bg-green-400' 
                : 'bg-[#3b82f6] dark:bg-[#3b82f6]'
            }`}
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={votedCount}
            aria-valuemin={0}
            aria-valuemax={voterCount}
            aria-label={`${votedCount} of ${voterCount} participants have voted`}
          />
        </div>
      </div>

      {/* Status Message */}
      {showDetails && (
        <div className="flex items-center gap-2">
          {room.votesRevealed ? (
            <>
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Votes revealed ({votedCount} of {voterCount} participants voted)
              </span>
            </>
          ) : allVotersHaveVoted ? (
            <>
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Everyone has voted!
              </span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-[#3b82f6] dark:text-[#3b82f6] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-slate-600 dark:text-[#aaaaaa]">
                Waiting for {voterCount - votedCount} more vote{voterCount - votedCount === 1 ? '' : 's'}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(VoteProgressIndicator);