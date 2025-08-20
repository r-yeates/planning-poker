'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
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

export default function RoomPage() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | string | null>(null);  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [wasInRoom, setWasInRoom] = useState(false); // Track if user was ever in the room
  const [showNewRoundNotification, setShowNewRoundNotification] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [previousRoundState, setPreviousRoundState] = useState<{votesRevealed: boolean; hasVotes: boolean} | null>(null);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [isRoomSettingsCollapsed, setIsRoomSettingsCollapsed] = useState(true);

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

  // Track user activity (mouse move, key press, clicks)
  useEffect(() => {
    if (!hasJoined) return;

    const handleActivity = () => {
      updateParticipantActivity();
    };

    // Update activity every 30 seconds while user is active
    const activityInterval = setInterval(handleActivity, 30000);

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity update
    handleActivity();

    return () => {
      clearInterval(activityInterval);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [hasJoined, updateParticipantActivity]);

  // Update participant status based on activity (runs every minute)
  useEffect(() => {
    if (!room || !roomId || !hasJoined) return;

    const updateStatuses = async () => {
      const now = new Date();
      const updates: Record<string, string> = {};
      
      Object.entries(room.participants).forEach(([id, participant]) => {
        if (!participant.lastActivity) return;
        
        const lastActivity = new Date(participant.lastActivity);
        const minutesSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
        
        let newStatus: 'active' | 'idle' | 'disconnected';
        if (minutesSinceActivity < 2) newStatus = 'active';
        else if (minutesSinceActivity < 10) newStatus = 'idle';
        else newStatus = 'disconnected';
        
        if (participant.status !== newStatus) {
          updates[`participants.${id}.status`] = newStatus;
        }
      });

      if (Object.keys(updates).length > 0) {
        try {
          const docRef = doc(db, 'rooms', roomId);
          await updateDoc(docRef, updates);
        } catch (error) {
          console.error('Error updating participant statuses:', error);
        }
      }
    };

    const statusInterval = setInterval(updateStatuses, 60000); // Check every minute
    return () => clearInterval(statusInterval);
  }, [room, roomId, hasJoined]);

  // Clean up disconnected participants (runs every 5 minutes)
  useEffect(() => {
    if (!room || !roomId || !hasJoined) return;

    const cleanupDisconnectedUsers = async () => {
      const now = new Date();
      const participantEntries = Object.entries(room.participants);
      
      // Find participants who have been disconnected for more than 15 minutes
      const disconnectedParticipants = participantEntries.filter(([, participant]) => {
        if (!participant.lastActivity) return false;
        
        const lastActivity = new Date(participant.lastActivity);
        const minutesSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
        
        return minutesSinceActivity > 15; // 15 minutes threshold
      });

      if (disconnectedParticipants.length === 0) return;

      console.log(`Cleaning up ${disconnectedParticipants.length} disconnected participants`);

      try {
        const docRef = doc(db, 'rooms', roomId);
        
        // Remove disconnected participants and their votes
        const updates: Record<string, ReturnType<typeof deleteField> | boolean> = {};
        const disconnectedIds = disconnectedParticipants.map(([id]) => id);
        
        disconnectedIds.forEach(id => {
          updates[`participants.${id}`] = deleteField();
          if (room.votes?.[id]) {
            updates[`votes.${id}`] = deleteField();
          }
        });

        // Check if any remaining participants exist
        const remainingParticipants = participantEntries.filter(([id]) => !disconnectedIds.includes(id));
        
        if (remainingParticipants.length === 0) {
          // If no participants left, delete the entire room
          await deleteDoc(docRef);
          await trackRoomClosedSafe();
          console.log('Room deleted - no active participants remaining');
        } else {
          // Check if we need to assign a new host
          const wasHostDisconnected = disconnectedParticipants.some(([, participant]) => participant.isHost);
          
          if (wasHostDisconnected) {
            // Find a new host from remaining participants
            const newHostId = remainingParticipants[0][0];
            updates[`participants.${newHostId}.isHost`] = true;
            console.log(`Assigned new host: ${newHostId}`);
          }

          await updateDoc(docRef, updates);
          console.log('Cleaned up disconnected participants');
        }
      } catch (error) {
        console.error('Error cleaning up disconnected participants:', error);
      }
    };

    // Run cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanupDisconnectedUsers, 5 * 60 * 1000);
    
    // Also run cleanup on component mount (after a short delay)
    const initialCleanupTimeout = setTimeout(cleanupDisconnectedUsers, 10000);
    
    return () => {
      clearInterval(cleanupInterval);
      clearTimeout(initialCleanupTimeout);
    };
  }, [room, roomId, hasJoined]);

  // Initialize userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = Math.random().toString(36).substring(2);
      localStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    }  }, []);  // Check if user has been kicked (only after they've joined)
  useEffect(() => {
    if (!room || !userId || !wasInRoom) return;
    
    // If user was in room but is no longer a participant, they were kicked
    if (!room.participants[userId]) {
      console.log('User was kicked from room, redirecting to home');
      router.push('/');
    }  }, [room, userId, wasInRoom, router]);

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
      
        // Set up room listener
        const unsubscribe = onSnapshot(
          doc(db, 'rooms', roomData.id),
          (doc) => {
            if (!doc.exists()) {
              setError('Room not found');
              setIsLoading(false);
              return;
            }
            
            const roomData = doc.data() as Room;
            setRoom(roomData);
            setIsLoading(false);
          },
          (error) => {
            console.error('Room subscription error:', error);
            setError('Failed to subscribe to room updates');
            setIsLoading(false);
          }
        );

        unsubscribeRef = unsubscribe;
      } catch (error) {
        console.error('Error setting up room subscription:', error);
        setError('Failed to connect to room');
        setIsLoading(false);
      }
    };

    lookupAndSubscribe();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef) {
        console.log('Cleaning up room subscription');
        unsubscribeRef();
      }
    };

    // Cleanup function
    return () => {
      if (unsubscribeRef) {
        console.log('Cleaning up room subscription');
        unsubscribeRef();
      }
    };
  }, [roomCode, userId]);

  // Memoized admin status
  const isAdmin = useMemo(() => {
    return room && userId ? (room.participants[userId]?.isHost || false) : false;
  }, [room, userId]);
  // Handle participant status changes
  useEffect(() => {
    if (!room || !userId) return;
    
    if (room.participants[userId]) {
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
  }, [room, userId, roomCode]);

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
    if (previousRoundState) {
      const isNewRound = previousRoundState.votesRevealed === true && 
                        previousRoundState.hasVotes === true &&
                        currentState.votesRevealed === false && 
                        currentState.hasVotes === false;                          if (isNewRound && !showNewRoundNotification) {
        console.log('New round detected - transition from revealed to reset');
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
    if (previousRoundState && 
        previousRoundState.votesRevealed === false && 
        currentState.votesRevealed === true && 
        currentState.hasVotes === true && 
        room.confettiEnabled) {
      console.log('Votes revealed - triggering confetti!');
      triggerVoteRevealConfetti();
    }
    
    // Update previous state for next comparison
    setPreviousRoundState(currentState);
  }, [room?.votesRevealed, room?.votes, hasJoined, showNewRoundNotification, room, previousRoundState]);
  // Sync selected card with user's vote in database
  useEffect(() => {
    if (!room || !userId) return;
    
    const userVote = room.votes?.[userId];
    if (userVote && selectedCard !== userVote.value) {
      // User has voted but local state doesn't reflect it
      console.log('Syncing selected card with database vote:', userVote.value);
      setSelectedCard(userVote.value);
    } else if (!userVote && selectedCard !== null) {
      // User's vote was cleared but local state still shows selection
      console.log('User vote cleared, clearing selected card');
      setSelectedCard(null);
    }
  }, [room?.votes, userId, selectedCard, room]);
  // Clear selected card when votes are reset (new round)
  useEffect(() => {
    // If room exists and votes object is empty (reset), clear selected card
    if (room && Object.keys(room.votes || {}).length === 0 && selectedCard !== null) {
      console.log('Votes were cleared, resetting selected card');
      setSelectedCard(null);
    }
  }, [room?.votes, selectedCard, room]);
  // Auto-reveal votes when all players have voted (if enabled)
  useEffect(() => {
    console.log('Auto-reveal effect triggered:', {
      hasRoom: !!room,
      hasRoomId: !!roomId,
      votesRevealed: room?.votesRevealed,
      autoReveal: room?.autoReveal,
      autoRevealType: typeof room?.autoReveal
    });
    
    if (!room || !roomId || room.votesRevealed) {
      console.log('Early return: missing room data or votes already revealed');
      return;
    }
    
    // Explicitly check autoReveal property - default to false if undefined
    const autoRevealEnabled = room.autoReveal === true;
    console.log('Auto-reveal enabled check:', autoRevealEnabled, 'raw value:', room.autoReveal);
      if (!autoRevealEnabled) {
      console.log('Auto-reveal is disabled, skipping auto-reveal');
      return;
    }
    
    // Use corrected voter counting logic (exclude spectators)
    const votersOnly = Object.entries(room.participants).filter(([, participant]) => 
      participant.role !== 'spectator'
    );
    const voterIds = votersOnly.map(([id]) => id);
    const votedIds = Object.keys(room.votes || {});
    const votersWhoVoted = voterIds.filter(id => votedIds.includes(id));
    
    console.log('Auto-reveal voting status:', {
      totalVoters: voterIds.length,
      votedCount: votersWhoVoted.length,
      voterIds,
      votedIds: votedIds
    });
    
    // Check if all voters (excluding spectators) have voted
    if (voterIds.length > 0 && votersWhoVoted.length === voterIds.length) {
      console.log('All voters voted and auto-reveal is enabled, setting timer to reveal votes...');
      // Auto-reveal after a short delay to allow for UI updates
      const timer = setTimeout(async () => {
        console.log('Executing auto-reveal...');
        try {
          const docRef = doc(db, 'rooms', roomId);
          await updateDoc(docRef, {
            votesRevealed: true
          });
          console.log('Auto-reveal completed successfully');
        } catch (error) {
          console.error('Error auto-revealing votes:', error);
        }
      }, 1000);
      
      return () => {
        console.log('Clearing auto-reveal timer');
        clearTimeout(timer);
      };
    } else {
      console.log('Not all voters have voted yet, waiting...');
    }
  }, [room?.votes, room?.participants, room?.votesRevealed, room?.autoReveal, roomId, room]);

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
      alert('Failed to copy link. Please copy it manually.');
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

    setSelectedCard(value);
    try {
      const docRef = doc(db, 'rooms', roomId);
      
      // Check if this is the first vote and auto-lock room if enabled
      const updateData: Record<string, import('firebase/firestore').FieldValue | object | string | number | boolean | undefined> = {
        [`votes.${userId}`]: { value },
        [`participants.${userId}.lastActivity`]: new Date(),
        [`participants.${userId}.status`]: 'active'
      };
      await updateDoc(docRef, updateData);
      // Track analytics
      await trackVoteCastSafe();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleNameSubmit = useCallback(async (name: string, password?: string) => {
    console.log('🚀 handleNameSubmit called:', { 
      name, 
      hasPassword: !!password, 
      roomHasPassword: !!room?.password,
      userId, 
      roomId, 
      hasRoom: !!room 
    });
    
    if (!userId || !roomId || !room) {
      console.error('❌ Missing required data:', { userId, roomId, hasRoom: !!room });
      setError('Unable to join room. Please try again.');
      return;
    }

    // Double check user isn't already a participant
    if (room.participants[userId]) {
      console.log('ℹ️ User already in room during name submit');
      setHasJoined(true);
      setShowNamePrompt(false);
      return;
    }

    // Check if room is locked (unless user is the creator)
    const isCreator = sessionStorage.getItem('roomCreator') === room.roomCode;
    if (room.isLocked && !isCreator) {
      console.log('🔒 Room is locked, preventing new participant from joining');
      setError('This room is locked and not accepting new participants.');
      return;
    }

    // Check password if room is password-protected (unless user is the creator)
    if (room.password && !isCreator) {
      console.log('🔒 Room is password protected, checking password...');
      if (!password) {
        console.log('❌ No password provided for protected room');
        setPasswordError('This room requires a password');
        return;
      }
      
      console.log('🔍 Verifying password...');
      try {
        const isPasswordValid = await verifyRoomPassword(room.roomCode, password);
        console.log('🔍 Password verification result:', isPasswordValid);
        if (!isPasswordValid) {
          console.log('❌ Incorrect password');
          setPasswordError('Incorrect password');
          return;
        }
        console.log('✅ Password verified successfully');
      } catch (error) {
        console.error('❌ Error verifying password:', error);
        setPasswordError('Error verifying password. Please try again.');
        return;
      }
    } else if (isCreator) {
      console.log('🎉 User is room creator, skipping password check');
      // Clear the creator flag after first use
      sessionStorage.removeItem('roomCreator');
    }    console.log('✅ All checks passed, joining room...');
    setPasswordError(''); // Clear any previous password errors
    setJoining(true);
    try {
      console.log('Attempting to join room');
      const docRef = doc(db, 'rooms', roomId);
      
      // Check if this is the first person joining the room (should become host)
      const isFirstParticipant = Object.keys(room.participants).length === 0;
      
      await updateDoc(docRef, {
        [`participants.${userId}`]: {
          name: name,
          isHost: isFirstParticipant, // First person becomes the host
          role: 'voter',
          lastActivity: new Date(),
          status: 'active'
        }
      });      console.log('Successfully joined room');
      
      // Track analytics
      await trackParticipantJoinedSafe();
        localStorage.setItem('userName', name);
      setHasJoined(true);
      setWasInRoom(true); // Track that user joined the room
      setShowNamePrompt(false);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please reload and try again.');
    } finally {
      setJoining(false);
    }
  }, [userId, roomId, room]);

  const handleKickParticipant = async (participantId: string) => {
    if (!room || !roomId || !isAdmin) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [participantId]: _removed, ...remainingParticipants } = room.participants;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [participantId]: _removedVote, ...remainingVotes } = room.votes || {};
      // Note: _removed and _removedVote are intentionally unused as we only need the remaining objects

      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        participants: remainingParticipants,
        votes: remainingVotes
      });
    } catch (error) {
      console.error('Error kicking participant:', error);
    }  };

  // Function to hand over host role
  const handleMakeHost = async (participantId: string) => {
    if (!room || !roomId || !isAdmin) return;
    // Only allow if participant exists and is not already host
    if (!room.participants[participantId] || room.participants[participantId].isHost) return;
    try {
      // Remove host from current user, assign to selected participant
      const updatedParticipants = { ...room.participants };
      Object.keys(updatedParticipants).forEach((id) => {
        updatedParticipants[id] = {
          ...updatedParticipants[id],
          isHost: id === participantId
        };
      });
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        participants: updatedParticipants
      });
    } catch (error) {
      console.error('Error handing over host:', error);
    }
  };

  const handleReveal = async () => {
    if (!room || !roomId) return;
    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        votesRevealed: true
      });
      
      // Trigger confetti celebration only if enabled
      if (room.confettiEnabled) {
        triggerVoteRevealConfetti();
      }
      
      // Track analytics - voting round completed
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
        votes: {}, // This clears all participant votes
        currentTicket: '',
        isLocked: false // Unlock room for new participants when starting new round
      });
      
      // Reset local selected card state
      setSelectedCard(null);
      
      console.log('Round reset successfully - all votes cleared and room unlocked');
    } catch (error) {
      console.error('Error resetting votes:', error);
    }
  };

  const handleRoleToggle = async () => {
    if (!room || !roomId || !userId || !room.participants[userId]) return;
    
    try {
      const currentRole = room.participants[userId].role;
      const newRole = currentRole === 'spectator' ? 'voter' : 'spectator';
      
      const docRef = doc(db, 'rooms', roomId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        [`participants.${userId}.role`]: newRole
      };
      
      // If switching to spectator, remove their vote
      if (newRole === 'spectator' && room.votes[userId]) {
        updateData[`votes.${userId}`] = deleteField();
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error toggling role:', error);
    }
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

    setIsLeavingRoom(true); // Prevent error states while leaving
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [userId]: _removed, ...remainingParticipants } = room.participants;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [userId]: _removedVote, ...remainingVotes } = room.votes || {};
      // Note: _removed and _removedVote are intentionally unused as we only need the remaining objects

      const docRef = doc(db, 'rooms', roomId);
        // If this is the last participant, delete the room
      if (Object.keys(remainingParticipants).length === 0) {
        await deleteDoc(docRef);
        // Track analytics - room closed
        await trackRoomClosedSafe();
      } else {
        // Check if the leaving user was the host
        if (room.participants[userId].isHost) {
          // Get remaining participant IDs and randomly select one as the new host
          const remainingParticipantIds = Object.keys(remainingParticipants);
          const newHostId = remainingParticipantIds[Math.floor(Math.random() * remainingParticipantIds.length)];
          
          // Update the new host's isHost property
          remainingParticipants[newHostId] = {
            ...remainingParticipants[newHostId],
            isHost: true
          };
        }

        // Update the room
        await updateDoc(docRef, {
          participants: remainingParticipants,
          votes: remainingVotes
        });
      }
      
      // Clean up all state and storage before navigation
      setHasJoined(false);
      setShowNamePrompt(false);
      setRoom(null);
      setRoomId(null);
      setError(''); // Clear any errors
      localStorage.removeItem('userName'); // Remove stored username to prevent auto-join
      
      // Navigate to home page immediately to prevent error states
      router.push('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      // Even if there's an error, navigate away to prevent getting stuck
      router.push('/');
    }  };
  
  // Room Settings Functions (moved from AdminPanel)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRoomSetting = async (field: keyof Room, value: any, additionalUpdates?: Record<string, any>) => {
    if (!isAdmin || !roomId) return;
    
    try {
      const updateData = { 
        [field]: value,
        ...additionalUpdates 
      };
      await updateDoc(doc(db, 'rooms', roomId), updateData);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  const toggleAutoReveal = () => {
    if (!room) return;
    updateRoomSetting('autoReveal', !room.autoReveal);
  };

  const toggleAnonymousVoting = () => {
    if (!room) return;
    updateRoomSetting('anonymousVoting', !room.anonymousVoting);
  };

  const toggleTooltips = () => {
    if (!room) return;
    updateRoomSetting('showTooltips', !room.showTooltips);
  };

  const toggleConfetti = () => {
    if (!room) return;
    updateRoomSetting('confettiEnabled', !room.confettiEnabled);
  };

  const toggleRoomLock = () => {
    if (!room) return;
    updateRoomSetting('isLocked', !room.isLocked);
  };

  const changeScale = (newScale: ScaleType) => {
    if (!room || !room.votesRevealed) return; // Prevent scale change during voting
    
    updateRoomSetting('scaleType', newScale, {
      votes: {},
      votesRevealed: false
    });
    
    // Reset card selection
    setSelectedCard(null);
  };

  // Auto-join effect for users coming from home page
  useEffect(() => {
    if (room && roomId && userId && !room.participants[userId] && !showNamePrompt && !hasJoined) {
      const userName = localStorage.getItem('userName');
      if (userName) {
        console.log('Auto-joining user from home page...');
        handleNameSubmit(userName);
      }
    }  }, [room, roomId, userId, showNamePrompt, hasJoined, handleNameSubmit]);
  // Calculate voting stats excluding spectators
  const votersOnly = Object.entries(room?.participants || {}).filter(([, participant]) => 
    participant.role !== 'spectator'
  );
  const voterCount = votersOnly.length;
  const votedCount = votersOnly.filter(([id]) => room?.votes[id]).length;
  const allVotersHaveVoted = voterCount > 0 && votedCount === voterCount;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading room...</h1>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading room...</h1>
        </div>
      </div>
    );
  }  const votes = Object.entries(room.votes || {});
  const averageVote = room.votesRevealed
    ? (() => {
        const numericVotes = votes
          .map(([, v]) => v.value)
          .filter((value): value is number => typeof value === 'number' && !isNaN(value));
        
        return numericVotes.length > 0 
          ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length 
          : null;
      })()
    : null;

  // Calculate consensus data
  const consensusData = room.votesRevealed && votes.length > 0
    ? (() => {
        const numericVotes = votes
          .map(([, v]) => v.value)
          .filter((value): value is number => typeof value === 'number' && !isNaN(value));
        
        if (numericVotes.length < 2) return null;
        
        const minVote = Math.min(...numericVotes);
        const maxVote = Math.max(...numericVotes);
        const spread = maxVote - minVote;
        
        // Calculate consensus percentage
        let consensus = 100;
        if (spread > 0) {
          // Perfect consensus = 100%, larger spread = lower consensus
          // Formula: 100 - (spread / maxVote * 100), with minimum of 0
          consensus = Math.max(0, Math.round(100 - (spread / Math.max(maxVote, 1)) * 100));
        }
        
        // Determine consensus level and color
        let level = '';
        let color = '';
        let bgColor = '';
        let textColor = '';
        
        if (consensus >= 90) {
          level = 'Excellent';
          color = 'text-green-600 dark:text-green-400';
          bgColor = 'bg-green-50 dark:bg-green-900/20';
          textColor = 'text-green-800 dark:text-green-200';
        } else if (consensus >= 70) {
          level = 'Good';
          color = 'text-yellow-600 dark:text-yellow-400';
          bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
          textColor = 'text-yellow-800 dark:text-yellow-200';
        } else {
          level = 'Needs Discussion';
          color = 'text-red-600 dark:text-red-400';
          bgColor = 'bg-red-50 dark:bg-red-900/20';
          textColor = 'text-red-800 dark:text-red-200';
        }
        
        return {
          consensus,
          level,
          color,
          bgColor,
          textColor,
          spread,
          minVote,
          maxVote
        };
      })()
    : null;return (
    <>
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-[#0f0f0f]">
      {/* Header - Wide Container */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* Header with theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative w-8 h-8">
              <Image src="/logo-dark.png" alt="Sprintro Logo" width={32} height={32} className="rounded-lg block dark:hidden" />
              <Image src="/logo.png" alt="Sprintro Logo" width={32} height={32} className="rounded-lg hidden dark:block" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f1f1f1]">Sprintro</h1>
          </div>
            {/* Room Info and Admin Controls */}
          <div className="flex items-center gap-2">
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
              onClick={shareRoom}
              className="flex items-center gap-2 px-3 py-2 h-10 rounded-lg border bg-white dark:bg-[#212121] border-slate-200 dark:border-[#303030] text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors"
              title="Click to copy room link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
              </svg>
              <span className="text-sm font-mono font-bold">{room?.roomCode}</span>
              {room?.password && (
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
                <svg className="w-3 h-3 text-slate-400 dark:text-[#aaaaaa]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              )}
            </button>

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
              >
                {room.participants[userId].role === 'spectator' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm">Voting</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm">Spectate</span>
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

      {/* Body Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto">        <div className="grid lg:grid-cols-4 gap-6">          {/* Left Column - Voting Info & Participants */}
          <div className="lg:col-span-1 space-y-6">
            {/* Vote Progress, Current Ticket & Room Settings - Combined */}
            <div className="bg-white dark:bg-[#212121] rounded-lg shadow border border-slate-200 dark:border-[#303030]">
              {/* Vote Progress */}
              <div className="px-3 py-2">
                <VoteProgressIndicator room={room} compact={true} showDetails={false} />
              </div>
              
              {/* Current Ticket */}
              {room.currentTicket && (
                <div className="px-3 py-2 border-t border-slate-200 dark:border-[#303030]">
                  <div className="text-xs text-slate-500 dark:text-[#888888] mb-1">Current Ticket</div>
                  <div className="text-sm text-slate-800 dark:text-[#cccccc] font-medium line-clamp-2">
                    {room.currentTicket}
                  </div>
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
                            disabled={!room.votesRevealed}
                          >
                            {Object.values(ESTIMATION_SCALES).map((scale) => (
                              <option key={scale.type} value={scale.type}>
                                {scale.name}
                              </option>
                            ))}
                          </select>
                          {!room.votesRevealed && (
                            <p className="text-xs text-slate-500">
                              Scale can be changed after votes are revealed
                            </p>
                          )}
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
                            <div className="text-xs text-slate-500 dark:text-[#888888]">Hide names during voting</div>
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
                          vote={room.votes[id]?.value}
                          isCurrentUser={isCurrentUser}
                          isAdmin={isAdmin}
                          votesRevealed={room.votesRevealed}
                          anonymousVoting={room.anonymousVoting}
                          averageVote={averageVote ?? undefined}
                          onKick={handleKickParticipant}
                          onMakeHost={handleMakeHost}
                          isHost={participant.isHost}
                        />
                      );
                    })}
              </div>
            </div>
            
            {/* Ticket Queue Section */}
            <TicketQueue
              room={room}
              roomId={roomId || ''}
              userId={userId}
              isAdmin={isAdmin}
            />
          </div>

          {/* Right Column - Game Content (Large) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Average Vote Display */}
            {room.votesRevealed && averageVote !== null && (
              <div className="bg-white dark:bg-[#212121] p-4 rounded-lg shadow border border-slate-200 dark:border-[#303030]">
                <h2 className="text-base font-medium text-slate-700 dark:text-[#cccccc]">Average Vote</h2>
                <p className="text-xl text-slate-900 dark:text-[#f1f1f1]">{averageVote.toFixed(1)}</p>
                {(() => {
                  const totalVotes = votes.length;
                  const numericVotes = votes
                    .map(([, v]) => v.value)
                    .filter((value): value is number => typeof value === 'number' && !isNaN(value));
                  const nonNumericCount = totalVotes - numericVotes.length;
                  
                  return nonNumericCount > 0 && (
                    <p className="text-sm text-slate-500 dark:text-[#888888] mt-1">
                      Based on {numericVotes.length} numeric vote{numericVotes.length !== 1 ? 's' : ''} 
                      {nonNumericCount > 0 && ` (${nonNumericCount} abstention${nonNumericCount !== 1 ? 's' : ''})`}
                    </p>
                  );
                })()}
              </div>
            )}

        {/* Consensus Indicator */}
        {consensusData && (
          <div className={`${consensusData.bgColor} border-l-4 border-l-green-500 p-4 rounded-lg shadow ${
            consensusData.consensus >= 90 ? 'border-l-green-500' : 
            consensusData.consensus >= 70 ? 'border-l-yellow-500' : 'border-l-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {consensusData.consensus >= 90 ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : consensusData.consensus >= 70 ? (
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  <div>
                    <h3 className={`font-semibold ${consensusData.textColor}`}>
                      Team Consensus: {consensusData.level}
                    </h3>
                    <p className={`text-sm ${consensusData.textColor} opacity-90`}>
                      {consensusData.consensus}% alignment (spread: {consensusData.spread} points)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${consensusData.color}`}>
                  {consensusData.consensus}%
                </div>
                <div className={`text-xs ${consensusData.textColor} opacity-70`}>
                  {consensusData.minVote} - {consensusData.maxVote}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={consensusData.textColor}>Low</span>
                <span className={consensusData.textColor}>High</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#404040] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    consensusData.consensus >= 90 ? 'bg-green-500' :
                    consensusData.consensus >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${consensusData.consensus}%` }}
                ></div>
              </div>
            </div>

            {/* Consensus Tips */}
            <div className={`mt-3 text-xs ${consensusData.textColor} opacity-80`}>
              {consensusData.consensus >= 90 ? (
                "🎉 Great alignment! The team is in strong agreement."
              ) : consensusData.consensus >= 70 ? (
                "💭 Moderate consensus. Consider discussing the differences briefly."
              ) : (
                "🗣️ Low consensus detected. Time for discussion before deciding!"
              )}
            </div>
          </div>
        )}        {/* Voting Cards */}
        <VotingCards
          room={room}
          userId={userId}
          selectedCard={selectedCard}
          onVote={handleVote}
        />

        {/* Admin Voting Controls */}
        {isAdmin && (
          <div className="flex justify-center">
            {!room.votesRevealed ? (
              (() => {
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
              })()
            ) : (
              <button
                onClick={handleReset}
                className="btn btn-secondary px-8 py-3 text-base"
              >
                New Round
              </button>
            )}
          </div>
        )}        {/* Version Footer */}
        <div className="text-center mt-8 space-y-1">
          {/* <p className="text-xs text-gray-400 dark:text-gray-500">v{packageJson.version}</p> */}
          <p className="text-xs text-slate-500 dark:text-[#aaaaaa]">
            Press <kbd className="px-2 py-1 text-xs bg-white dark:bg-[#212121] border border-slate-200 dark:border-[#303030] rounded text-slate-600 dark:text-[#aaaaaa]">H</kbd> for keyboard shortcuts
          </p>
        </div>

          {/* End Right Column */}
          </div>
        
        {/* End 2-Column Grid */}
        </div>
      </div>      {/* New Round Notification */}
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
              onClick={handleCloseNotification}
              className="ml-2 p-1 text-green-200 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Name Prompt Modal */}
      {showNamePrompt && room && (
        <NamePrompt
          onSubmit={handleNameSubmit}
          isLoading={joining}
          requiresPassword={!!room?.password && sessionStorage.getItem('roomCreator') !== room.roomCode}
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