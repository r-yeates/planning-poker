'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { doc, onSnapshot, updateDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { db, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackParticipantJoinedSafe, trackVoteCastSafe, trackVotingRoundCompletedSafe, trackRoomClosedSafe } from '@/lib/analytics-buffer';
import type { Room } from '@/lib/firebase';
import { ESTIMATION_SCALES, type ScaleType } from '@/lib/estimation-scales';

import NamePrompt from '@/app/components/room/NamePrompt';
import ThemeToggle from '@/app/components/global/ThemeToggle';
import ParticipantCard from '@/app/components/room/ParticipantCard';
import VotingCards from '@/app/components/room/VotingCards';
import VoteProgressIndicator from '@/app/components/room/VoteProgressIndicator';
import KeyboardShortcuts from '@/app/components/room/KeyboardShortcuts';
import { triggerVoteRevealConfetti } from '@/app/components/room/ConfettiCelebration';
import TicketQueue from '@/app/components/room/TicketQueue';
import VotingTimer from '@/app/components/room/VotingTimer';

export default function RoomPageRedesign() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [wasInRoom, setWasInRoom] = useState(false);
  const [showNewRoundNotification, setShowNewRoundNotification] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [previousRoundState, setPreviousRoundState] = useState<{votesRevealed: boolean; hasVotes: boolean} | null>(null);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);

  // Redesign-specific state
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [activeBottomPanel, setActiveBottomPanel] = useState<'none' | 'queue' | 'settings' | 'history'>('none');
  const [showStatusBar, setShowStatusBar] = useState(true);

  // Activity tracking
  const updateParticipantActivity = useCallback(async () => {
    if (!roomId || !userId || !hasJoined) return;
    
    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        [`participants.${userId}.lastActivity`]: new Date(),
        [`participants.${userId}.status`]: 'active'
      });
    } catch (error) {
      console.error('Error updating participant activity:', error);
    }
  }, [roomId, userId, hasJoined]);

  // Track user activity
  useEffect(() => {
    if (!hasJoined) return;

    const handleActivity = () => {
      updateParticipantActivity();
    };

    const activityInterval = setInterval(handleActivity, 30000);
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    handleActivity();

    return () => {
      clearInterval(activityInterval);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [hasJoined, updateParticipantActivity]);

  // Initialize userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = Math.random().toString(36).substring(2);
      localStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Check if user has been kicked
  useEffect(() => {
    if (!room || !userId || !wasInRoom) return;
    
    if (!room.participants[userId]) {
      console.log('User was kicked from room, redirecting to home');
      router.push('/');
    }
  }, [room, userId, wasInRoom, router]);

  // Look up room by code and set up room listener
  useEffect(() => {
    if (!roomCode || !userId) return;

    let unsubscribeRef: (() => void) | null = null;

    const lookupAndSubscribe = async () => {
      setIsLoading(true);
      setError('');
      try {
        const roomData = await getRoomByCode(roomCode as string);
        if (!roomData) {
          setError('Room not found');
          setIsLoading(false);
          return;
        }

        setRoomId(roomData.id);
      
        const unsubscribe = onSnapshot(
          doc(db, 'rooms', roomData.id),
          (doc) => {
            if (doc.exists()) {
              const roomData = doc.data() as Room;
              
              setRoom(roomData);
              setIsLoading(false);
              
              if (roomData.participants[userId]) {
                setHasJoined(true);
                setWasInRoom(true);
                setShowNamePrompt(false);
              } else {
                const isVerified = sessionStorage.getItem('roomJoinVerified');
                const isCreator = sessionStorage.getItem('roomCreator');
                const userName = localStorage.getItem('userName');
                
                if (!userName) {
                  setShowNamePrompt(true);
                  setHasJoined(false);
                } else if (isVerified === roomCode) {
                  sessionStorage.removeItem('roomJoinVerified');
                  if (isCreator === roomCode) {
                    sessionStorage.removeItem('roomCreator');
                  }
                  setShowNamePrompt(false);
                  setHasJoined(false);
                } else {
                  setShowNamePrompt(true);
                  setHasJoined(false);
                }
              }
            } else {
              setError('Room not found');
              setIsLoading(false);
            }
          },
          (error) => {
            console.error('Error fetching room:', error);
            setError('Error loading room');
            setIsLoading(false);
          }
        );

        unsubscribeRef = unsubscribe;
        return unsubscribe;
      } catch (error) {
        console.error('Error looking up room:', error);
        setError('Error loading room');
        setIsLoading(false);
      }
    };

    lookupAndSubscribe();

    return () => {
      if (unsubscribeRef) {
        console.log('Cleaning up room subscription');
        unsubscribeRef();
      }
    };
  }, [roomCode, userId]);

  // Update isAdmin status
  useEffect(() => {
    if (room && userId) {
      setIsAdmin(room.participants[userId]?.isHost || false);
    }
  }, [room, userId]);

  // Check if Web Share API is available
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  // Handle voting
  const handleVote = async (value: number | string) => {
    if (!room || !roomId || !userId) return;
    if (room.votesRevealed) return;

    setSelectedCard(value);
    try {
      const docRef = doc(db, 'rooms', roomId);
      
      const isFirstVote = Object.keys(room.votes || {}).length === 0;
      const updateData: any = {
        [`votes.${userId}`]: { value },
        [`participants.${userId}.lastActivity`]: new Date(),
        [`participants.${userId}.status`]: 'active'
      };
      
      if (isFirstVote && !room.isLocked) {
        updateData.isLocked = true;
        console.log('🔒 Auto-locking room on first vote');
      }
      
      await updateDoc(docRef, updateData);
      await trackVoteCastSafe();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Handle name submission
  const handleNameSubmit = useCallback(async (name: string, password?: string) => {
    if (!userId || !roomId || !room) {
      setError('Unable to join room. Please try again.');
      return;
    }

    if (room.participants[userId]) {
      setHasJoined(true);
      setShowNamePrompt(false);
      return;
    }

    const isCreator = sessionStorage.getItem('roomCreator') === room.roomCode;
    if (room.isLocked && !isCreator) {
      setError('This room is locked and not accepting new participants.');
      return;
    }

    if (room.password && !isCreator) {
      if (!password) {
        setPasswordError('This room requires a password');
        return;
      }
      
      try {
        const isPasswordValid = await verifyRoomPassword(room.roomCode, password);
        if (!isPasswordValid) {
          setPasswordError('Incorrect password');
          return;
        }
      } catch (error) {
        console.error('Error verifying password:', error);
        setPasswordError('Error verifying password. Please try again.');
        return;
      }
    } else if (isCreator) {
      sessionStorage.removeItem('roomCreator');
    }

    setPasswordError('');
    setJoining(true);
    try {
      const docRef = doc(db, 'rooms', roomId);
      const isFirstParticipant = Object.keys(room.participants).length === 0;
      
      await updateDoc(docRef, {
        [`participants.${userId}`]: {
          name: name,
          isHost: isFirstParticipant,
          role: 'voter',
          lastActivity: new Date(),
          status: 'active'
        }
      });

      await trackParticipantJoinedSafe();
      localStorage.setItem('userName', name);
      setHasJoined(true);
      setWasInRoom(true);
      setShowNamePrompt(false);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please reload and try again.');
    } finally {
      setJoining(false);
    }
  }, [userId, roomId, room]);

  // Room control functions
  const handleReveal = async () => {
    if (!room || !roomId) return;
    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        votesRevealed: true
      });
      
      if (room.confettiEnabled) {
        triggerVoteRevealConfetti();
      }
      
      await trackVotingRoundCompletedSafe();
    } catch (error) {
      console.error('Error revealing votes:', error);
    }
  };
  
  const handleReset = async () => {
    if (!room || !roomId) return;

    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        votesRevealed: false,
        votes: {},
        currentTicket: '',
        isLocked: false
      });
      
      setSelectedCard(null);
      console.log('Round reset successfully - all votes cleared and room unlocked');
    } catch (error) {
      console.error('Error resetting votes:', error);
    }
  };

  const shareRoom = async () => {
    if (!room?.roomCode) return;
    const shareUrl = `${window.location.origin}/room/${room.roomCode}`;
    try {
      if (canShare) {
        await navigator.share({
          title: 'Join my Planning Poker room',
          text: `Join my Planning Poker room`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert('Failed to copy link. Please copy it manually.');
      }
    }
  };

  // Calculate voting stats
  const votersOnly = Object.entries(room?.participants || {}).filter(([, participant]) => 
    participant.role !== 'spectator'
  );
  const voterCount = votersOnly.length;
  const votedCount = votersOnly.filter(([id]) => room?.votes[id]).length;
  const allVotersHaveVoted = voterCount > 0 && votedCount === voterCount;

  // Calculate results
  const votes = Object.entries(room?.votes || {});
  const averageVote = room?.votesRevealed
    ? (() => {
        const numericVotes = votes
          .map(([, v]) => v.value)
          .filter((value): value is number => typeof value === 'number' && !isNaN(value));
        
        return numericVotes.length > 0 
          ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length 
          : null;
      })()
    : null;

  // Calculate consensus
  const consensusData = room?.votesRevealed && votes.length > 0
    ? (() => {
        const numericVotes = votes
          .map(([, v]) => v.value)
          .filter((value): value is number => typeof value === 'number' && !isNaN(value));
        
        if (numericVotes.length < 2) return null;
        
        const minVote = Math.min(...numericVotes);
        const maxVote = Math.max(...numericVotes);
        const spread = maxVote - minVote;
        
        let consensus = 100;
        if (spread > 0) {
          consensus = Math.max(0, Math.round(100 - (spread / Math.max(maxVote, 1)) * 100));
        }
        
        let level = '';
        let suggestion = '';
        
        if (consensus >= 90) {
          level = 'Excellent';
          suggestion = 'Great alignment! Ready to proceed.';
        } else if (consensus >= 70) {
          level = 'Good';
          suggestion = 'Good consensus. Consider brief discussion.';
        } else {
          level = 'Needs Discussion';
          suggestion = 'Low consensus. Discussion recommended.';
        }
        
        return { consensus, level, suggestion, spread, minVote, maxVote };
      })()
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f0f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Loading room...</h1>
        </div>
      </div>
    );
  }

  if (error && !isLeavingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f0f]">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showNamePrompt) {
    const isCreator = sessionStorage.getItem('roomCreator') === room?.roomCode;
    const requiresPassword = !!room?.password && !isCreator;
    
    return (
      <NamePrompt 
        onSubmit={handleNameSubmit} 
        isLoading={joining}
        requiresPassword={requiresPassword}
        passwordError={passwordError}
      />
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f0f]">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Loading room...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f] flex flex-col">
      {/* Header Bar */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image 
                src="/logo-dark.png" 
                alt="Sprintro" 
                width={32} 
                height={32} 
                className="rounded-lg block dark:hidden" 
              />
              <Image 
                src="/logo.png" 
                alt="Sprintro" 
                width={32} 
                height={32} 
                className="rounded-lg hidden dark:block" 
              />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sprintro</h1>
          </div>

          {/* Room Info & Controls */}
          <div className="flex items-center gap-3">
            {/* Room Code */}
            <button
              onClick={shareRoom}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{room.roomCode}</span>
              {copied && (
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Timer */}
            {hasJoined && roomId && (
              <VotingTimer
                room={room}
                roomId={roomId}
                isAdmin={isAdmin}
                compact={true}
              />
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Menu */}
            <div className="flex items-center gap-2">
              {userId && room.participants[userId] && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {room.participants[userId].name || 'Unknown User'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {showStatusBar && (room.isLocked || room.anonymousVoting || room.password) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              {room.isLocked && (
                <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Room Locked
                </div>
              )}
              {room.anonymousVoting && (
                <div className="flex items-center gap-1 text-purple-700 dark:text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Anonymous Voting
                </div>
              )}
              {room.password && (
                <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password Protected
                </div>
              )}
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {votedCount}/{voterCount} voted
              </div>
            </div>
            <button
              onClick={() => setShowStatusBar(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-6 h-full">
          {/* Left Sidebar - Participants */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-slate-200 dark:border-slate-700 p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">Team ({voterCount})</h2>
                <button
                  onClick={() => setShowParticipantDetails(!showParticipantDetails)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showParticipantDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {!showParticipantDetails ? (
                /* Compact Grid View */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(room.participants)
                      .slice(0, 6)
                      .map(([id, participant]) => {
                        const hasVoted = room.votes[id] !== undefined;
                        const participantName = participant.name || 'Unknown';
                        return (
                          <div key={id} className="text-center">
                            <div className="relative mb-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto ${
                                participant.isHost ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}>
                                {participantName.slice(0, 2).toUpperCase()}
                              </div>
                              {/* Status dot */}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                id === userId ? 'bg-green-400' : 'bg-gray-400'
                              }`} />
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {participantName.split(' ')[0]}
                            </div>
                            <div className="text-xs mt-1">
                              {participant.role === 'spectator' ? (
                                <span className="text-purple-600">👁️</span>
                              ) : hasVoted ? (
                                <span className="text-green-600">✅</span>
                              ) : (
                                <span className="text-yellow-600">⏳</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Quick Stats */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Progress:</span>
                      <span className="font-medium">{votedCount}/{voterCount}</span>
                    </div>
                    {consensusData && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Consensus:</span>
                        <span className={`font-medium ${
                          consensusData.consensus >= 90 ? 'text-green-600' :
                          consensusData.consensus >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {consensusData.consensus}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Detailed List View */
                <div className="space-y-3">
                  {Object.entries(room.participants)
                    .sort(([, a], [, b]) => {
                      if (a.isHost && !b.isHost) return -1;
                      if (!a.isHost && b.isHost) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map(([id, participant]) => (
                      <ParticipantCard
                        key={id}
                        participantId={id}
                        participant={participant}
                        vote={room.votes[id]?.value}
                        isCurrentUser={id === userId}
                        isAdmin={isAdmin}
                        votesRevealed={room.votesRevealed}
                        anonymousVoting={room.anonymousVoting}
                        averageVote={averageVote ?? undefined}
                        onKick={() => {}}
                        onMakeHost={() => {}}
                        isHost={participant.isHost}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Voting Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Ticket */}
            {room.currentTicket && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Estimate this story
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 text-lg">
                      {room.currentTicket}
                    </p>
                  </div>
                  {room.votesRevealed && (
                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Estimation</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {averageVote ? averageVote.toFixed(1) : '—'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voting Interface */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              {!room.votesRevealed ? (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Choose your estimate
                  </h3>
                  <VotingCards
                    room={room}
                    userId={userId}
                    selectedCard={selectedCard}
                    onVote={handleVote}
                  />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="text-slate-600 dark:text-slate-400">
                      {votedCount} of {voterCount} participants have voted
                    </div>
                    {!allVotersHaveVoted && (
                      <div className="text-slate-500 dark:text-slate-400">
                        Waiting for others...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Results Display */
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Estimation Results
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Average</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {averageVote ? averageVote.toFixed(1) : '—'}
                      </div>
                    </div>
                    {consensusData && (
                      <div className="text-center">
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Consensus</div>
                        <div className={`text-3xl font-bold ${
                          consensusData.consensus >= 90 ? 'text-green-600' :
                          consensusData.consensus >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {consensusData.consensus}%
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {consensusData.level}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote Distribution */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Vote Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        votes.reduce((acc, [, vote]) => {
                          const val = vote.value.toString();
                          acc[val] = (acc[val] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([value, count]) => (
                        <div key={value} className="flex items-center gap-3">
                          <div className="w-8 text-sm font-mono text-slate-600 dark:text-slate-400">
                            {value}
                          </div>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / votes.length) * 100}%` }}
                            />
                          </div>
                          <div className="w-8 text-sm text-slate-600 dark:text-slate-400">
                            {count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestion */}
                  {consensusData?.suggestion && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-200">Suggestion</div>
                          <div className="text-sm text-blue-800 dark:text-blue-300">{consensusData.suggestion}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Controls */}
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex gap-3 justify-center">
                    {!room.votesRevealed ? (
                      <button
                        onClick={handleReveal}
                        disabled={votedCount === 0}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        Reveal Votes
                      </button>
                    ) : (
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      >
                        New Round
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Panels */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4">
          {/* Panel Tabs */}
          <div className="flex gap-1 py-2">
            {[
              { id: 'queue', label: 'Ticket Queue', icon: '📋' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
              { id: 'history', label: 'History', icon: '📊' }
            ].map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActiveBottomPanel(activeBottomPanel === panel.id ? 'none' : panel.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeBottomPanel === panel.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{panel.icon}</span>
                {panel.label}
                <svg 
                  className={`w-4 h-4 transition-transform ${activeBottomPanel === panel.id ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Panel Content */}
          {activeBottomPanel !== 'none' && (
            <div className="pb-4">
              {activeBottomPanel === 'queue' && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <TicketQueue
                    room={room}
                    roomId={roomId || ''}
                    userId={userId}
                    isAdmin={isAdmin}
                  />
                </div>
              )}
              
              {activeBottomPanel === 'settings' && isAdmin && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Room Settings</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Settings toggles would go here */}
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Settings panel content...
                    </div>
                  </div>
                </div>
              )}
              
              {activeBottomPanel === 'history' && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Voting History</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    History panel content...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      {hasJoined && room && userId && (
        <KeyboardShortcuts
          isAdmin={isAdmin}
          isSpectator={room.participants[userId]?.role === 'spectator'}
          onQuickVote={handleVote}
          onRevealVotes={handleReveal}
          onNewRound={handleReset}
          onToggleSpectator={() => {}}
          availableValues={ESTIMATION_SCALES[room.scaleType || 'fibonacci'].values}
        />
      )}

      {/* New Round Notification */}
      {showNewRoundNotification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          isNotificationVisible 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        }`}>
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-green-500/20">
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold">New Round Started!</div>
              <div className="text-sm text-green-100 opacity-90">Cast your votes for the next item</div>
            </div>
            <button
              onClick={() => {
                setIsNotificationVisible(false);
                setTimeout(() => setShowNewRoundNotification(false), 500);
              }}
              className="ml-2 p-1 text-green-200 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
