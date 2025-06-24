'use client';

import { useState, useEffect } from 'react';
import type { Room } from '@/lib/firebase';

interface VoteProgressIndicatorProps {
  room: Room;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export default function VoteProgressIndicator({
  room,
  className = '',
  showDetails = true,
  compact = false
}: VoteProgressIndicatorProps) {
  // Round timer state
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const [roundElapsedTime, setRoundElapsedTime] = useState(0);
  const [isRoundActive, setIsRoundActive] = useState(false);

  // Calculate voting stats excluding spectators
  const votersOnly = Object.entries(room?.participants || {}).filter(([_, participant]) => 
    participant.role !== 'spectator'
  );
  const voterCount = votersOnly.length;
  const votedCount = votersOnly.filter(([id, _]) => room?.votes[id]).length;
  const allVotersHaveVoted = voterCount > 0 && votedCount === voterCount;
  
  // Track round start/reset
  useEffect(() => {
    const hasVotes = room.votes && Object.keys(room.votes).length > 0;
    const votesRevealed = room.votesRevealed;
    
    // Start round timer when voting is possible (has voters) and no votes yet (new round)
    if (voterCount > 0 && !hasVotes && !votesRevealed) {
      if (!isRoundActive) {
        setRoundStartTime(Date.now());
        setIsRoundActive(true);
        setRoundElapsedTime(0);
      }
    }
    // Stop round timer when votes are revealed
    else if (votesRevealed) {
      setIsRoundActive(false);
    }
  }, [room.votes, room.votesRevealed, isRoundActive, voterCount]);

  // Round timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRoundActive && roundStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - roundStartTime) / 1000);
        setRoundElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRoundActive, roundStartTime]);

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
            <span className="text-gray-600 dark:text-gray-400">
              {room.votesRevealed ? 'Voting Results' : 'Voting Progress'}
            </span>
            <div className="flex items-center gap-3">
              {/* Round Timer */}
              {(isRoundActive || roundElapsedTime > 0) && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                    {formatTime(roundElapsedTime)}
                  </span>
                </div>
              )}
              <span className={`font-bold ${
                room.votesRevealed || allVotersHaveVoted 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {votedCount}/{voterCount}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                room.votesRevealed || allVotersHaveVoted 
                  ? 'bg-green-500 dark:bg-green-400' 
                  : 'bg-blue-500 dark:bg-blue-400'
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {room.votesRevealed ? 'Voting Results' : 'Voting Progress'}
        </h3>
        <div className="flex items-center gap-4">
          {/* Round Timer */}
          {(isRoundActive || roundElapsedTime > 0) && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">Round:</span>
              <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                {formatTime(roundElapsedTime)}
              </span>
            </div>
          )}
          <div className={`text-sm font-bold transition-colors duration-200 ${
            room.votesRevealed || allVotersHaveVoted 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {votedCount}/{voterCount}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              room.votesRevealed || allVotersHaveVoted 
                ? 'bg-green-500 dark:bg-green-400' 
                : 'bg-blue-500 dark:bg-blue-400'
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
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Waiting for {voterCount - votedCount} more vote{voterCount - votedCount === 1 ? '' : 's'}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}