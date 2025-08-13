'use client';

interface ParticipantCardProps {
  participantId: string;
  participant: {
    name: string;
    isHost: boolean;
    role: 'voter' | 'spectator' | 'admin';
    lastActivity?: Date;
    status?: 'active' | 'idle' | 'disconnected';
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

  // Helper to get initials from name
  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper to generate a color from participantId
  const getAvatarColor = (id: string) => {
    // Simple hash for color selection
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500',
      'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Helper to get status from lastActivity
  const getParticipantStatus = () => {
    if (isCurrentUser) return 'active'; // Current user is always active
    if (participant.status) return participant.status;
    
    // Calculate status from lastActivity if no explicit status
    if (!participant.lastActivity) return 'disconnected';
    
    const now = new Date();
    const lastActivity = new Date(participant.lastActivity);
    const minutesSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
    
    if (minutesSinceActivity < 2) return 'active';
    if (minutesSinceActivity < 10) return 'idle';
    return 'disconnected';
  };

  // Helper to get status indicator
  const getStatusIndicator = () => {
    const status = getParticipantStatus();
    const statusConfig = {
      active: { color: 'bg-green-400', label: 'Active' },
      idle: { color: 'bg-yellow-400', label: 'Idle' },
      disconnected: { color: 'bg-gray-400', label: 'Disconnected' }
    };
    
    const config = statusConfig[status];
    
    return (
      <div 
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#212121] ${config.color}`}
        title={config.label}
      />
    );
  };

  return (
    <div className={`bg-white dark:bg-[#212121] rounded-lg border p-3 transition-all hover:shadow-md group ${getBorderColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-full text-white font-bold text-sm select-none shadow ${getAvatarColor(participantId)}`}
              aria-label={`Avatar for ${participant.name}`}
            >
              {anonymousVoting && !votesRevealed ? '?' : getInitials(participant.name)}
            </span>
            {/* Status Indicator */}
            {getStatusIndicator()}
          </div>
          <div className="min-w-0">
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