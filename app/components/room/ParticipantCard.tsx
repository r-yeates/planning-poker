'use client';

interface ParticipantCardProps {
  participantId: string;
  participant: {
    name: string;
    isHost: boolean;
    role: 'voter' | 'spectator' | 'admin';
  };
  vote?: string | number;
  isCurrentUser: boolean;
  isAdmin: boolean;
  votesRevealed: boolean;
  anonymousVoting: boolean;
  averageVote?: number;
  onKick: (participantId: string) => void;
  onMakeHost?: (participantId: string) => void;
  isHost: boolean;
}

export default function ParticipantCard({
  participantId,
  participant,
  vote,
  isCurrentUser,
  isAdmin,
  votesRevealed,
  anonymousVoting,
  averageVote,
  onKick,
  onMakeHost
}: ParticipantCardProps) {
  const hasVoted = vote !== undefined;
    // Determine border color based on voting status
  const getBorderColor = () => {
    if (hasVoted && !votesRevealed && participant.role !== 'spectator') {
      return 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20';
    }
    return 'border-gray-200 dark:border-[#404040]';
  };
  
  const getVoteStatusText = () => {
    if (participant.role === 'spectator') {
      return null;
    }
    
    if (!hasVoted) {
      return <div className="text-xs text-red-600 dark:text-red-400">Waiting...</div>;
    }
    
    if (hasVoted && !votesRevealed) {
      return <div className="text-xs text-green-600 dark:text-green-400">✓ Voted</div>;
    }
    
    if (votesRevealed && vote !== undefined) {
      const voteValue = typeof vote === 'string' ? vote : vote.toString();
      const isCloseToAverage = averageVote && 
        typeof vote === 'number' && 
        Math.abs(vote - averageVote) <= 1;
      
      return (
        <div className={`text-sm font-bold ${
          isCloseToAverage 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-orange-600 dark:text-orange-400'
        }`}>
          {voteValue}
        </div>
      );
    }
    
    return null;
  };
  return (
    <div className={`bg-white dark:bg-[#212121] rounded-lg border p-3 transition-all hover:shadow-md group ${getBorderColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-gray-900 dark:text-white">
            {anonymousVoting && !votesRevealed 
              ? 'Anonymous' 
              : participant.name
            }
            {participant.isHost && (
              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Host
              </span>
            )}
            {participant.role === 'spectator' && (
              <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                Spectator
              </span>
            )}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
            )}
          </div>
          {getVoteStatusText()}
        </div>
        <div className="flex items-center gap-1">
          {/* Make Host button: only show if admin, not self, not already host */}
          {isAdmin && !isCurrentUser && !participant.isHost && onMakeHost && (
            <button
              onClick={() => onMakeHost(participantId)}
              className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 rounded border border-blue-200 dark:border-blue-800 transition-all"
              title="Make host"
            >
              Make Host
            </button>
          )}
          {isAdmin && !isCurrentUser && (
            <button
              onClick={() => onKick(participantId)}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-all"
              title="Remove participant"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}