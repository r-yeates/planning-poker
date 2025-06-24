'use client';

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
  // Calculate voting stats excluding spectators
  const votersOnly = Object.entries(room?.participants || {}).filter(([_, participant]) => 
    participant.role !== 'spectator'
  );
  const voterCount = votersOnly.length;
  const votedCount = votersOnly.filter(([id, _]) => room?.votes[id]).length;
  const allVotersHaveVoted = voterCount > 0 && votedCount === voterCount;
  
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
            <span className={`font-bold ${
              room.votesRevealed || allVotersHaveVoted 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {votedCount}/{voterCount}
            </span>
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
        <div className={`text-sm font-bold transition-colors duration-200 ${
          room.votesRevealed || allVotersHaveVoted 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {votedCount}/{voterCount}
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
