'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAnonymousAuth } from '@/lib/firebase';
import { roomAction, RoomApiError } from '@/lib/room-api';
import { FEATURES } from '@/lib/features';
import { HEARTBEAT_MS, getActiveVoterIds, isParticipantActive } from '@/lib/room-shared';

import type { Room } from '@/lib/firebase';
import { ESTIMATION_SCALES, type ScaleType } from '@/lib/estimation-scales';

import { useConfirm } from '@/app/components/global/ConfirmDialog';
import NamePrompt from '@/app/components/room/NamePrompt';
import ThemeToggle from '@/app/components/global/ThemeToggle';
import ParticipantCard from '@/app/components/room/ParticipantCard';
import VotingCards from '@/app/components/room/VotingCards';
import VoteProgressIndicator from '@/app/components/room/VoteProgressIndicator';
import KeyboardShortcuts from '@/app/components/room/KeyboardShortcuts';
import { triggerVoteRevealConfetti } from '@/app/components/room/ConfettiCelebration';
import VoteStats from '@/app/components/room/VoteStats';
import VotingTimer from '@/app/components/room/VotingTimer';
import ShareRoomModal from '@/app/components/room/ShareRoomModal';
import RoomChat from '@/app/components/room/RoomChat';
import TicketPanel from '@/app/components/room/TicketPanel';
import BacklogPanel from '@/app/components/room/BacklogPanel';
import EstimateControls from '@/app/components/room/EstimateControls';
import SessionSummary from '@/app/components/room/SessionSummary';


function RoomSkeleton() {
  const block = 'bg-slate-200 dark:bg-[#303030] rounded animate-pulse';
  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50 dark:bg-[#0f0f0f]" role="status" aria-label="Loading room">
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className={`${block} h-8 w-36`} />
        <div className={`${block} h-10 w-40`} />
      </div>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg shadow border border-slate-200 dark:border-[#303030] p-3 space-y-3">
            <div className={`${block} h-4 w-2/3`} />
            <div className={`${block} h-16 w-full`} />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-[#212121] rounded-lg border border-slate-200 dark:border-[#303030] p-3 flex items-center gap-3">
                <div className={`${block} h-8 w-8 rounded-full`} />
                <div className={`${block} h-4 flex-1`} />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-4 sm:grid-cols-6 gap-3 content-start">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={`${block} h-28`} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading room…</span>
    </div>
  );
}

export default function RoomPage() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | string | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const joinInFlightRef = useRef(false);
  const awaitingJoinSnapshotRef = useRef(false); // join succeeded; the room snapshot hasn't caught up yet
  const actionErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [joining, setJoining] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [wasInRoom, setWasInRoom] = useState(false); // Track if user was ever in the room
  const [showNewRoundNotification, setShowNewRoundNotification] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const previousRoundStateRef = useRef<{votesRevealed: boolean; hasVotes: boolean} | null>(null);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [isRoomSettingsCollapsed, setIsRoomSettingsCollapsed] = useState(true);
  const [wasRemoved, setWasRemoved] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirm();

  

  // Initialize userId via Firebase Anonymous Auth
  useEffect(() => {
    ensureAnonymousAuth()
      .then((uid) => {
        localStorage.setItem('userId', uid);
        setUserId(uid);
      })
      .catch((err) => {
        console.error('Anonymous sign-in failed:', err);
        setError('Could not sign in. Please check your connection and reload.');
        setIsLoading(false);
      });
  }, []);  // Check if user has been kicked (only after they've joined)
  useEffect(() => {
    if (!room || !userId || !wasInRoom) return;
    
    // If user was in room but is no longer a participant, they were kicked
    if (!room.participants[userId] && !isLeavingRoom) {
      setWasRemoved(true);
    }
  }, [room?.participants, userId, wasInRoom, isLeavingRoom]);

  // Subscribe to the room (room documents are keyed by their code)
  useEffect(() => {
    if (!roomCode || !userId) return;

    const id = (roomCode as string).toUpperCase();
    setIsLoading(true);
    setError('');
    setRoomId(id);

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Room not found');
          setIsLoading(false);
          return;
        }
        setRoom(snapshot.data() as Room);
        setIsLoading(false);
      },
      (error) => {
        console.error('Room subscription error:', error);
        setError('Failed to connect to room');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [roomCode, userId]);

  // Show a transient error for failed actions instead of failing silently
  const showActionError = useCallback((err: unknown, fallback: string) => {
    console.error(fallback, err);
    setActionError(err instanceof RoomApiError ? err.message : fallback);
    if (actionErrorTimeoutRef.current) clearTimeout(actionErrorTimeoutRef.current);
    actionErrorTimeoutRef.current = setTimeout(() => setActionError(''), 6000);
  }, []);

  // Run a room action, reporting failures. Returns true on success.
  const runAction = useCallback(
    async (action: string, payload: Record<string, unknown> = {}, failureMessage = 'That action failed. Please try again.') => {
      try {
        await roomAction(action, { roomCode: room?.roomCode ?? roomId, ...payload });
        return true;
      } catch (err) {
        showActionError(err, failureMessage);
        return false;
      }
    },
    [room?.roomCode, roomId, showActionError]
  );

  // Your own vote is private until reveal; read it from your own vote document
  useEffect(() => {
    if (!roomId || !userId || !hasJoined) return;
    return onSnapshot(
      doc(db, 'rooms', roomId, 'votes', userId),
      (snapshot) => setSelectedCard(snapshot.exists() ? (snapshot.data().value as number | string) : null),
      (error) => console.error('Vote subscription error:', error)
    );
  }, [roomId, userId, hasJoined]);

  // Presence heartbeat so absent participants stop blocking the round
  useEffect(() => {
    if (!roomId || !userId || !hasJoined) return;
    const beat = () => {
      updateDoc(doc(db, 'rooms', roomId), { [`presence.${userId}`]: serverTimestamp() }).catch(() => {});
    };
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [roomId, userId, hasJoined]);

  // Re-evaluate who is active even when no snapshot arrives
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(interval);
  }, []);

  // Memoized admin status
  const isAdmin = useMemo(() => {
    return room && userId ? (room.participants[userId]?.isHost || false) : false;
  }, [room?.participants, userId]);
  // Handle participant status changes
  useEffect(() => {
    if (!room || !userId) return;
    
    if (room.participants[userId]) {
      awaitingJoinSnapshotRef.current = false;
      setHasJoined(true);
      setWasInRoom(true);
      setShowNamePrompt(false);
    } else {
      // Heartbeat snapshots keep arriving mid-join; don't flash the prompt over an in-flight join.
      // While leaving, the snapshot without us must not start the join flow again either.
      if (joinInFlightRef.current || awaitingJoinSnapshotRef.current || isLeavingRoom) return;
      const isVerified = sessionStorage.getItem('roomJoinVerified');
      const userName = localStorage.getItem('userName');
      
      if (!userName) {
        setShowNamePrompt(true);
        setHasJoined(false);
      } else if (isVerified === roomCode) {
        sessionStorage.removeItem('roomJoinVerified');
        setShowNamePrompt(false);
        setHasJoined(false);
      } else {
        setShowNamePrompt(true);
        setHasJoined(false);
      }
    }
  }, [room?.participants, userId, roomCode, isLeavingRoom]);

  // Check if Web Share API is available
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);  // Detect new round and show notification
  useEffect(() => {
    if (!room || !hasJoined) return;
    
    const currentState = {
      votesRevealed: room.votesRevealed,
      hasVotes: Object.keys(room.votes || {}).length > 0
    };
    
    // Check if this is a transition from revealed votes to a reset state
    if (previousRoundStateRef.current) {
      const isNewRound = previousRoundStateRef.current.votesRevealed === true && 
                        previousRoundStateRef.current.hasVotes === true &&
                        currentState.votesRevealed === false && 
                        currentState.hasVotes === false;                          if (isNewRound && !showNewRoundNotification) {
        setShowNewRoundNotification(true);

        // Trigger enter animation with a slight delay for smoother effect
        setTimeout(() => {
          setIsNotificationVisible(true);
        }, 50);
        
        // Auto-hide notification after 4 seconds (longer visibility)
        setTimeout(() => {
          setIsNotificationVisible(false);
          // Hide completely after exit animation
          setTimeout(() => {
            setShowNewRoundNotification(false);
          }, 500);
        }, 4000);
      }
    }
    
    // Check if this is a transition to revealed votes (trigger confetti)
    if (previousRoundStateRef.current && 
        previousRoundStateRef.current.votesRevealed === false && 
        currentState.votesRevealed === true && 
        currentState.hasVotes === true && 
        room.confettiEnabled) {
      triggerVoteRevealConfetti();
    }
    
    // Update previous state for next comparison
    previousRoundStateRef.current = currentState;
  }, [room?.votesRevealed, room?.votes, hasJoined, showNewRoundNotification]);
  // Auto-reveal once every active voter has voted. Any client may trigger it (the
  // server re-checks the conditions), with jitter so they don't all fire at once.
  const shouldAutoReveal = (() => {
    if (!room || !hasJoined || room.votesRevealed || room.autoReveal !== true) return false;
    const voterIds = getActiveVoterIds(room, now);
    return voterIds.length > 0 && voterIds.every((id) => room.voted?.[id]);
  })();

  useEffect(() => {
    if (!shouldAutoReveal || !roomId) return;
    const timer = setTimeout(() => {
      roomAction('autoReveal', { roomCode: roomId }).catch((error) => console.error('Error auto-revealing votes:', error));
    }, 1000 + Math.random() * 1500);
    return () => clearTimeout(timer);
  }, [shouldAutoReveal, roomId]);

  // Function to copy room link to clipboard
  const copyRoomLink = async () => {
    if (!room?.roomCode) return;
    const shareUrl = `${window.location.origin}/room/${room.roomCode}`;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for unsupported browsers
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setActionError('Failed to copy link. Please copy it manually.');
      if (actionErrorTimeoutRef.current) clearTimeout(actionErrorTimeoutRef.current);
      actionErrorTimeoutRef.current = setTimeout(() => setActionError(''), 6000);
    }
  };

  // Function to share room link using Web Share API
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
        await copyRoomLink();
      }
    } catch {
      // Fall back to copying to clipboard if sharing fails
      await copyRoomLink();
    }
  };
  const handleVote = async (value: number | string) => {
    if (!room || !roomId || !userId) return;
    // Prevent voting if votes are revealed
    if (room.votesRevealed) return;

    const previous = selectedCard;
    setSelectedCard(value); // optimistic; the own-vote listener confirms
    // Send votes one at a time: concurrent vote transactions can commit out of order,
    // so a quick 3 → 21 change could otherwise end up saved as 3
    const send = voteQueueRef.current.then(() => runAction('vote', { value }, 'Your vote was not saved. Please try again.'));
    voteQueueRef.current = send.then(() => undefined);
    if (!(await send)) setSelectedCard(previous);
  };

  const handleNameSubmit = useCallback(async (name: string, password?: string) => {
    if (!userId || !roomId || !room) {
      setError('Unable to join room. Please try again.');
      return;
    }

    // Double check user isn't already a participant
    if (room.participants[userId]) {
      setHasJoined(true);
      setShowNamePrompt(false);
      return;
    }
    if (joinInFlightRef.current) return;

    // A password entered on the home page is held for this tab only
    const storedPasswordKey = `roomPassword:${room.roomCode}`;
    const submittedPassword = password || sessionStorage.getItem(storedPasswordKey) || undefined;

    joinInFlightRef.current = true;
    setPasswordError('');
    setJoining(true);
    try {
      // The server checks the lock, the password (rate-limited) and who becomes host
      await roomAction('join', { roomCode: room.roomCode, name, password: submittedPassword });
      sessionStorage.removeItem(storedPasswordKey);
      sessionStorage.removeItem('roomCreator');
      sessionStorage.removeItem('roomJoinVerified'); // consumed; a stale flag would auto-rejoin after leaving
      localStorage.setItem('userName', name);
      setNeedsPassword(false);
      setHasJoined(true);
      // wasInRoom is set by the snapshot once it lists us; setting it now would look like a kick
      awaitingJoinSnapshotRef.current = true;
      setShowNamePrompt(false);
    } catch (error) {
      console.error('Error joining room:', error);
      const apiError = error instanceof RoomApiError ? error : null;
      if (apiError?.code === 'password_required' || apiError?.code === 'wrong_password') {
        sessionStorage.removeItem(storedPasswordKey);
        setNeedsPassword(true);
        setPasswordError(apiError.code === 'wrong_password' ? 'Incorrect password' : 'This room requires a password');
        setShowNamePrompt(true);
      } else if (apiError?.code === 'removed') {
        setWasRemoved(true);
      } else if (apiError?.code === 'rate_limited') {
        setNeedsPassword(true);
        setPasswordError(apiError.message);
        setShowNamePrompt(true);
      } else {
        setError(apiError?.message || 'Failed to join room. Please reload and try again.');
      }
    } finally {
      joinInFlightRef.current = false;
      setJoining(false);
    }
  }, [userId, roomId, room]);

  const handleKickParticipant = (participantId: string) => {
    if (!isAdmin) return;
    return runAction('kick', { targetId: participantId }, 'Could not remove that participant.');
  };

  const handleClearVote = (participantId: string) => {
    if (!isAdmin) return;
    return runAction('clearVote', { targetId: participantId }, 'Could not clear that vote.');
  };

  const handleMakeHost = (participantId: string) => {
    if (!isAdmin) return;
    return runAction('makeHost', { targetId: participantId }, 'Could not hand over the host role.');
  };

  const handleReveal = () => {
    if (!isAdmin) return;
    // Confetti is triggered by the reveal transition effect for every client
    return runAction('reveal', {}, 'Could not reveal the votes. Please try again.');
  };

  // Votes cast in a round that hasn't been revealed would be discarded by moving on
  const roundInProgress = !!room && !room.votesRevealed && Object.keys(room.voted || {}).length > 0;

  // Skip: records a revealed round without an estimate, then moves to the next ticket
  const handleReset = async () => {
    if (!isAdmin) return;
    if (roundInProgress && !(await confirm({ title: 'Move on?', message: 'Votes have been cast but not revealed. Moving on discards them.', confirmLabel: 'Discard and continue', destructive: true }))) return;
    if (await runAction('newRound', {}, 'Could not start a new round. Please try again.')) {
      setSelectedCard(null);
    }
  };

  const handleRevote = async () => {
    if (!isAdmin) return;
    if (await runAction('revote', {}, 'Could not restart voting. Please try again.')) {
      setSelectedCard(null);
    }
  };

  const handleFinalize = (finalEstimate: number | string | null, advance: boolean) =>
    runAction('finalize', { finalEstimate, advance }, 'Could not save the estimate. Please try again.');

  const handleSetTicket = (text: string) => runAction('setTicket', { text }, 'Could not update the ticket.');

  const handleAddBacklog = (text: string, mode: 'append' | 'replace') =>
    runAction('setBacklog', { text, mode }, 'Could not update the backlog.');

  const handleRemoveBacklogItem = (ticketId: string) => {
    runAction('removeBacklogItem', { ticketId }, 'Could not remove that ticket.');
  };

  const handleGoToTicket = async (index: number) => {
    if (await runAction('goToTicket', { index }, 'Could not switch tickets.')) {
      setSelectedCard(null);
    }
  };

  const handleRoleToggle = () => {
    if (!room || !userId || !room.participants[userId]) return;
    return runAction('toggleRole', {}, 'Could not change your role.');
  };

  const handleCloseNotification = () => {
    // Start exit animation
    setIsNotificationVisible(false);
    // Hide completely after exit animation
    setTimeout(() => {
      setShowNewRoundNotification(false);
    }, 500);
  };

  const handleLeaveRoom = async () => {
    if (!room || !roomId || !userId) return;
    const left = await confirm({
      title: 'Leave the room?',
      message: isAdmin ? 'The host role will pass to another participant.' : undefined,
      confirmLabel: 'Leave',
      destructive: true,
    });
    if (!left) return;

    setIsLeavingRoom(true); // Prevent error states while leaving

    try {
      // The server reassigns the host if needed and deletes the room when it empties
      await roomAction('leave', { roomCode: roomId });
    } catch (error) {
      console.error('Error leaving room:', error);
    }

    // Clean up all state and storage before navigation (even on error, to avoid getting stuck)
    setHasJoined(false);
    setShowNamePrompt(false);
    setRoom(null);
    setRoomId(null);
    setError('');
    localStorage.removeItem('userName'); // Remove stored username to prevent auto-join
    router.push('/');
  };

  // Room settings (host only; enforced again on the server)
  const updateRoomSetting = async (patch: Record<string, boolean>) => {
    if (!isAdmin || !room) return;
    // Apply immediately so the toggle feels instant; the snapshot confirms it, and a failure rolls it back
    const previous = Object.fromEntries(Object.keys(patch).map((key) => [key, room[key as keyof Room]]));
    setRoom((current) => (current ? { ...current, ...patch } : current));
    const ok = await runAction('settings', { patch }, 'Could not update that setting.');
    if (!ok) setRoom((current) => (current ? { ...current, ...previous } : current));
  };

  const toggleAutoReveal = () => room && updateRoomSetting({ autoReveal: !room.autoReveal });
  const toggleAnonymousVoting = () => room && updateRoomSetting({ anonymousVoting: !room.anonymousVoting });
  const toggleTooltips = () => room && updateRoomSetting({ showTooltips: !room.showTooltips });
  const toggleConfetti = () => room && updateRoomSetting({ confettiEnabled: !room.confettiEnabled });
  const toggleRoomLock = () => room && updateRoomSetting({ isLocked: !room.isLocked });

  const changeScale = async (newScale: ScaleType) => {
    if (!room || !isAdmin || newScale === room.scaleType) return;
    // Changing the scale clears the round, so confirm if there is anything to lose
    const hasVotes = Object.keys(room.voted || {}).length > 0 || Object.keys(room.votes || {}).length > 0;
    if (hasVotes && !(await confirm({ title: 'Change scale?', message: 'Changing the scale clears the current votes.', confirmLabel: 'Change scale', destructive: true }))) return;
    if (await runAction('changeScale', { scaleType: newScale }, 'Could not change the scale.')) {
      setSelectedCard(null);
    }
  };

  // Auto-join effect for users coming from home page
  useEffect(() => {
    if (room && roomId && userId && !room.participants[userId] && !showNamePrompt && !hasJoined && !isLeavingRoom && !wasRemoved) {
      const userName = localStorage.getItem('userName');
      if (userName) {
        handleNameSubmit(userName);
      }
    }
  }, [room?.participants, roomId, userId, showNamePrompt, hasJoined, isLeavingRoom, wasRemoved, handleNameSubmit]);
  // Calculate voting stats excluding spectators
  // Active voters only: spectators and participants who went away don't hold up the round
  const activeVoterIds = room ? getActiveVoterIds(room, now) : [];
  const voterCount = activeVoterIds.length;
  const votedCount = activeVoterIds.filter((id) => room?.voted?.[id]).length;
  const allVotersHaveVoted = voterCount > 0 && votedCount === voterCount;

  if (wasRemoved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-[#f1f1f1]">You were removed</h1>
          <p className="text-slate-600 dark:text-[#aaaaaa]">The host removed you from this room, so you can&apos;t rejoin it.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] shadow-md transition-all duration-200"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <RoomSkeleton />;

  if (error && !isLeavingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600 dark:text-[#aaaaaa]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] shadow-md hover:shadow-lg transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (showNamePrompt) {
    const isCreator = sessionStorage.getItem('roomCreator') === room?.roomCode;
    const requiresPassword = needsPassword || (!!room?.hasPassword && !isCreator);
    
    return (
      <NamePrompt 
        onSubmit={handleNameSubmit} 
        isLoading={joining}
        requiresPassword={requiresPassword}
        passwordError={passwordError}
      />
    );
  }

  if (!room) return <RoomSkeleton />;  // Room age warning (> 24 hours)
  const createdAtMs = room.createdAt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (typeof (room.createdAt as any).toMillis === 'function' ? (room.createdAt as any).toMillis() : new Date(room.createdAt as string | Date).getTime())
    : 0;
  const isRoomOld = createdAtMs > 0 && Date.now() - createdAtMs > 24 * 60 * 60 * 1000;

  return (
    <>
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50 dark:bg-[#0f0f0f]">
      {/* Header - Wide Container */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* Header with theme toggle */}
        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
          <div className="flex items-center gap-3">
            <span className="relative w-8 h-8">
              <Image src="/logo-dark.png" alt="Sprintro Logo" width={32} height={32} className="rounded-lg block dark:hidden" />
              <Image src="/logo.png" alt="Sprintro Logo" width={32} height={32} className="rounded-lg hidden dark:block" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f1f1f1]">Sprintro</h1>
          </div>
            {/* Room Info and Admin Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            
            {/* Timer Button - Show to everyone when running, admin controls when not */}
            {hasJoined && roomId && (
              <VotingTimer
                room={room}
                roomId={roomId}
                isAdmin={isAdmin}
                compact={true}
              />
            )}
            
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 h-10 rounded-lg border bg-white dark:bg-[#212121] border-slate-200 dark:border-[#303030] text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors"
              title="Invite — show QR code and link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
              </svg>
              <span className="text-sm font-mono font-bold">{room?.roomCode}</span>
              {room?.hasPassword && (
                <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {room?.anonymousVoting && (
                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {room?.isLocked && (
                <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {copied ? (
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-slate-400 dark:text-[#aaaaaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4H8a2 2 0 00-2 2v2M4 12v4a2 2 0 002 2h2M12 20h4a2 2 0 002-2v-2M20 12V8a2 2 0 00-2-2h-2M9 9h1v1H9zM9 14h1v1H9zM14 9h1v1h-1z" />
                </svg>
              )}
            </button>

            {/* Session summary */}
            {FEATURES.sessionSummary && hasJoined && (
              <button
                onClick={() => setShowSummary(true)}
                className="flex items-center gap-2 px-3 py-2 h-10 rounded-lg border bg-white dark:bg-[#212121] border-slate-200 dark:border-[#303030] text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors"
                title="Session summary and export"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-sm hidden sm:inline">Summary</span>
                {(room.roundHistory?.length ?? 0) > 0 && (
                  <span className="text-xs font-semibold px-1.5 rounded-full bg-slate-100 dark:bg-[#303030]">{room.roundHistory?.length}</span>
                )}
              </button>
            )}

            {/* Spectator Toggle */}
            {userId && room?.participants[userId] && (
              <button
                onClick={handleRoleToggle}
                className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg border transition-colors ${
                  room.participants[userId].role === 'spectator'
                    ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                    : 'bg-white dark:bg-[#212121] border-slate-200 dark:border-[#303030] text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#303030]'
                }`}
                title={room.participants[userId].role === 'spectator' ? 'Switch to Voting Mode' : 'Switch to Spectator Mode'}
                aria-pressed={room.participants[userId].role === 'spectator'}
              >
                {room.participants[userId].role === 'spectator' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm">Spectating</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm">Voting</span>
                  </>
                )}
              </button>            )}
            
            
            
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-3 py-2 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Leave Room"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="text-sm">Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Room age warning */}
      {isRoomOld && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            This room is over 24 hours old and may be stale. Consider creating a new room for your session.
          </div>
        </div>
      )}

      {/* Body Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto">        <div className="grid lg:grid-cols-4 gap-6">          {/* Left Column - Voting Info & Participants */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            {/* Vote Progress, Current Ticket & Room Settings - Combined */}
            <div className="bg-white dark:bg-[#212121] rounded-lg shadow border border-slate-200 dark:border-[#303030]">
              {/* Vote Progress */}
              <div className="px-3 py-2">
                <VoteProgressIndicator room={room} compact={true} showDetails={false} />
              </div>
              
              {/* Current Ticket */}
              {FEATURES.ticketEntry && (room.ticket || isAdmin) && (
                <div className="px-3 py-2 border-t border-slate-200 dark:border-[#303030]">
                  <TicketPanel ticket={room.ticket} isAdmin={isAdmin} onSave={handleSetTicket} />
                </div>
              )}

              {/* Read-only summary of the room's settings for everyone but the host */}
              {!isAdmin && (
                <div className="px-3 py-2 border-t border-slate-200 dark:border-[#303030] flex flex-wrap gap-1.5" aria-label="Room settings">
                  {[
                    { label: ESTIMATION_SCALES[room.scaleType || 'fibonacci'].name, on: true },
                    { label: 'Auto-reveal', on: !!room.autoReveal },
                    { label: 'Anonymous voting', on: !!room.anonymousVoting },
                    { label: 'Locked', on: !!room.isLocked },
                  ].map(({ label, on }) => (
                    <span
                      key={label}
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        on
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-50 dark:bg-[#181818] border-slate-200 dark:border-[#303030] text-slate-400 dark:text-[#777777] line-through'
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Room Settings - Only for Admin Users */}
              {isAdmin && (
                <>
                  {/* Room Settings Header with toggle */}
                  <div className="border-t border-slate-200 dark:border-[#303030]">
                    <button
                      onClick={() => setIsRoomSettingsCollapsed(!isRoomSettingsCollapsed)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors"
                    >
                      <div className="flex items-center gap-2">        
                        <div>
                          <h3 className="text-base font-medium text-slate-800 dark:text-[#cccccc]">Room Settings</h3>
                        </div>
                      </div>
                      <svg 
                        className={`w-4 h-4 text-slate-400 transition-transform ${isRoomSettingsCollapsed ? '' : 'rotate-180'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Room Settings Collapsible Content */}
                    {!isRoomSettingsCollapsed && (
                      <div className="px-3 pb-3 space-y-3 border-t border-slate-200 dark:border-[#303030] pt-3">
                        {/* Scale Management */}
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-slate-700 dark:text-[#cccccc]">
                            Estimation Scale
                          </label>
                          <select 
                            value={room.scaleType || 'fibonacci'} 
                            onChange={(e) => changeScale(e.target.value as ScaleType)}
                            className="w-full p-2 border border-slate-300 dark:border-[#404040] rounded bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f1f1f1] focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            {Object.values(ESTIMATION_SCALES).map((scale) => (
                              <option key={scale.type} value={scale.type}>
                                {scale.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-500">
                            Changing the scale clears the current votes
                          </p>
                        </div>

                        {/* Auto-Reveal Setting */}
                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#181818] rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-[#f1f1f1]">Auto-reveal votes</div>
                            <div className="text-xs text-slate-500 dark:text-[#888888]">Auto-show when everyone votes</div>
                          </div>
                          <button
                            onClick={toggleAutoReveal}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                              room.autoReveal ? 'bg-blue-600' : 'bg-slate-200 dark:bg-[#404040]'
                            }`}
                            role="switch"
                            aria-checked={room.autoReveal}
                            aria-label="Auto-reveal votes"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                room.autoReveal ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        
                        {/* Anonymous Voting Setting */}
                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#181818] rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-[#f1f1f1]">Anonymous voting</div>
                            <div className="text-xs text-slate-500 dark:text-[#888888]">Hides names in the UI only; revealed votes still carry user ids</div>
                          </div>
                          <button
                            onClick={toggleAnonymousVoting}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-1 ${
                              room.anonymousVoting ? 'bg-[#3b82f6]' : 'bg-slate-200 dark:bg-[#404040]'
                            }`}
                            role="switch"
                            aria-checked={room.anonymousVoting}
                            aria-label="Anonymous voting"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                room.anonymousVoting ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Card Tooltips Setting */}
                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#303030] rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-[#f1f1f1]">Card tooltips</div>
                            <div className="text-xs text-slate-500 dark:text-[#aaaaaa]">Show card descriptions</div>
                          </div>
                          <button
                            onClick={toggleTooltips}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-1 ${
                              room.showTooltips ? 'bg-[#3b82f6]' : 'bg-slate-200 dark:bg-[#404040]'
                            }`}
                            role="switch"
                            aria-checked={room.showTooltips}
                            aria-label="Card tooltips"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                room.showTooltips ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Confetti Celebrations Setting */}
                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#303030] rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-[#f1f1f1]">Confetti celebrations</div>
                            <div className="text-xs text-slate-500 dark:text-[#aaaaaa]">Show confetti on reveal</div>
                          </div>
                          <button
                            onClick={toggleConfetti}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-1 ${
                              room.confettiEnabled ? 'bg-[#3b82f6]' : 'bg-slate-200 dark:bg-[#404040]'
                            }`}
                            role="switch"
                            aria-checked={room.confettiEnabled}
                            aria-label="Confetti celebrations"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                room.confettiEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Room Lock Setting */}
                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#303030] rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-[#f1f1f1]">Lock room</div>
                            <div className="text-xs text-slate-500 dark:text-[#aaaaaa]">Prevent new participants from joining</div>
                          </div>
                          <button
                            onClick={toggleRoomLock}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-1 ${
                              room.isLocked ? 'bg-red-600' : 'bg-slate-200 dark:bg-[#404040]'
                            }`}
                            role="switch"
                            aria-checked={room.isLocked}
                            aria-label="Lock room"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                room.isLocked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Backlog queue — visible to everyone, editable by the host */}
            {FEATURES.backlog && (
            <BacklogPanel
              backlog={room.backlog || []}
              ticketIndex={room.ticketIndex ?? null}
              history={room.roundHistory || []}
              isAdmin={isAdmin}
              roundInProgress={roundInProgress}
              onAdd={handleAddBacklog}
              onRemove={handleRemoveBacklogItem}
              onGoTo={handleGoToTicket}
            />
            )}

            {/* Chat — visible on desktop in left column; on mobile it sits here in flow */}
            {hasJoined && roomId && userId && room.participants[userId] && (
              <div className="hidden lg:block">
                <RoomChat
                  roomId={roomId}
                  userId={userId}
                  userName={room.participants[userId].name}
                />
              </div>
            )}

            {/* Participants Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-[#f1f1f1] flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
                  </svg>
                  Participants ({Object.keys(room?.participants || {}).length})
                </h3>
              </div>
              <div className="space-y-3">
                  {Object.entries(room.participants)
                    .sort(([, a], [, b]) => {
                      // Primary sort: hosts first
                      if (a.isHost && !b.isHost) return -1;
                      if (!a.isHost && b.isHost) return 1;
                      // Secondary sort: stable alphabetical by name
                      return a.name.localeCompare(b.name);
                    })
                    .map(([id, participant]) => {
                      const isCurrentUser = id === userId;
                      
                      return (
                        <ParticipantCard
                          key={id}
                          participantId={id}
                          participant={participant}
                          vote={room.votes?.[id]?.value}
                          hasVoted={!!room.voted?.[id]}
                          isActive={isParticipantActive(room.presence, id, now)}
                          isCurrentUser={isCurrentUser}
                          isAdmin={isAdmin}
                          votesRevealed={room.votesRevealed}
                          anonymousVoting={room.anonymousVoting}
                          onKick={handleKickParticipant}
                          onMakeHost={handleMakeHost}
                          onClearVote={handleClearVote}
                          isHost={participant.isHost}
                        />
                      );
                    })}
              </div>
            </div>
            
          </div>

          {/* Right Column - Game Content (Large) */}
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
        {/* Vote Statistics */}
        <VoteStats room={room} />

        {/* Voting Cards */}
        <VotingCards
          room={room}
          userId={userId}
          selectedCard={selectedCard}
          onVote={handleVote}
        />

        {/* Admin Voting Controls */}
        {isAdmin && !room.votesRevealed && (
          <div className="flex justify-center">
            {(() => {
                // Check voting status for button styling
                // const votersOnly = Object.entries(room.participants).filter(([, p]) => p.role !== 'spectator');
                // const votedIds = Object.keys(room.votes || {});
                return (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={handleReveal}
                      className={`px-8 py-3 text-base font-medium rounded-lg transition-all duration-300 ${
                        allVotersHaveVoted && !room.autoReveal
                          ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-lg'
                          : 'btn btn-primary'
                      }`}
                    >
                      {allVotersHaveVoted && !room.autoReveal ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <b>All Voted - Reveal Now!</b>
                        </span>
                      ) : (
                        'Reveal Votes'
                      )}
                    </button>
                    {allVotersHaveVoted && !room.autoReveal && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Everyone has voted! Click to reveal.
                      </p>
                    )}
                    {!allVotersHaveVoted && (
                      <p className="text-sm text-slate-500 dark:text-[#aaaaaa]">
                        {voterCount === 0 ? 'No voters in room' : `${votedCount} of ${voterCount} voted`}
                      </p>
                    )}
                  </div>
                );
              })()}
          </div>
        )}

        {/* After reveal: host records the agreed estimate; everyone sees it once saved */}
        {room.votesRevealed && !FEATURES.finalEstimates && isAdmin && (
          <div className="flex justify-center">
            <button onClick={handleReset} className="btn btn-secondary px-8 py-3 text-base">
              New Round
            </button>
          </div>
        )}
        {room.votesRevealed && FEATURES.finalEstimates && (
          <EstimateControls
            room={room}
            isAdmin={isAdmin}
            onFinalize={handleFinalize}
            onRevote={handleRevote}
            onSkip={handleReset}
          />
        )}        {/* Version Footer */}
        <div className="text-center mt-8 space-y-1">
          {/* <p className="text-xs text-gray-400 dark:text-gray-500">v{packageJson.version}</p> */}
          <p className="text-xs text-slate-500 dark:text-[#aaaaaa]">
            Press <kbd className="px-2 py-1 text-xs bg-white dark:bg-[#212121] border border-slate-200 dark:border-[#303030] rounded text-slate-600 dark:text-[#aaaaaa]">H</kbd> for keyboard shortcuts
          </p>
        </div>

              {/* Chat — visible on mobile only (below voting area) */}
            {hasJoined && roomId && userId && room.participants[userId] && (
              <div className="lg:hidden">
                <RoomChat
                  roomId={roomId}
                  userId={userId}
                  userName={room.participants[userId].name}
                />
              </div>
            )}

        {/* End Right Column */}
          </div>
        
        {/* End 2-Column Grid */}
        </div>
      </div>      {confirmDialog}

      {/* Action error toast */}
      {actionError && (
        <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 text-white shadow-lg text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-100 hover:text-white" aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* New Round Notification */}
      {showNewRoundNotification && (
        <div role="status" aria-live="polite" aria-label="New round started" className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
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
              onClick={handleCloseNotification}
              aria-label="Dismiss notification"
              className="ml-2 p-1 text-green-200 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {FEATURES.sessionSummary && showSummary && room?.roomCode && (
        <SessionSummary
          roomCode={room.roomCode}
          history={room.roundHistory || []}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Share / QR Code Modal */}
      {showShareModal && room?.roomCode && (
        <ShareRoomModal
          roomCode={room.roomCode}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Name Prompt Modal */}
      {showNamePrompt && room && (
        <NamePrompt
          onSubmit={handleNameSubmit}
          isLoading={joining}
          requiresPassword={needsPassword || (!!room?.hasPassword && sessionStorage.getItem('roomCreator') !== room.roomCode)}
          passwordError={passwordError}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {hasJoined && room && userId && (
        <KeyboardShortcuts
          isAdmin={isAdmin}
          isSpectator={room.participants[userId]?.role === 'spectator'}
          onQuickVote={handleVote}
          onRevealVotes={handleReveal}
          onNewRound={handleReset}
          onToggleSpectator={handleRoleToggle}
          availableValues={ESTIMATION_SCALES[room.scaleType || 'fibonacci'].values}
        />
      )}
    </div>
    {/* <PrivacyTermsFooter /> */}
    </>
  );
}