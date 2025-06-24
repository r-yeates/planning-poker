'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room } from '@/lib/firebase';

interface VotingTimerProps {
  room: Room;
  roomId: string;
  isAdmin: boolean;
}

export default function VotingTimer({ room, roomId, isAdmin }: VotingTimerProps) {
  const [timeInput, setTimeInput] = useState('5');
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);  // Calculate remaining time from room data
  const [showControls, setShowControls] = useState(false);  const [showNotification, setShowNotification] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false); // For animation
  const [notificationExiting, setNotificationExiting] = useState(false); // For exit animation
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [wasRunning, setWasRunning] = useState(false);
  const timerActive = !!(room.timer && (room.timer.isRunning || (room.timer.startTime && room.timer.duration > 0)));
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (room.timer && room.timer.isRunning && room.timer.startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - room.timer.startTime) / 1000);
      const remaining = Math.max(0, room.timer.duration - elapsed);
      setRemainingTime(remaining);
      setIsRunning(remaining > 0 && room.timer.isRunning);
      
      // Track that timer was running
      if (remaining > 0) {
        setWasRunning(true);
      }
    } else {
      setRemainingTime(0);
      setIsRunning(false);
    }
  }, [room.timer]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, remainingTime]);  useEffect(() => {
    // Only show notification if timer was actually running and now reached 0
    if (remainingTime === 0 && !isRunning && wasRunning && room.timer && room.timer.startTime) {
      setShowControls(false);
      setShowNotification(true);
      setNotificationVisible(false); // Start hidden
      setNotificationExiting(false);
      setWasRunning(false); // Reset the flag
      
      // Start slide-in animation after a brief delay
      setTimeout(() => {
        setNotificationVisible(true);
      }, 50);
      
      // Auto-dismiss after 4s (from when visible)
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = setTimeout(() => {
        setNotificationExiting(true);
      }, 4050); // 4s + 50ms delay
    }
  }, [isRunning, remainingTime, wasRunning, room.timer]);

  // When exit animation starts, hide notification after animation
  useEffect(() => {
    if (notificationExiting) {
      // Wait for animation (500ms) before hiding
      const t = setTimeout(() => {
        setShowNotification(false);
        setNotificationVisible(false);
        setNotificationExiting(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [notificationExiting]);

  // Clean up timeout on unmount or when notification is dismissed
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  // Reset notification state when starting or stopping timer
  const resetNotificationState = () => {
    setShowNotification(false);
    setNotificationVisible(false);
    setNotificationExiting(false);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  };

  // Show timer banner when running OR when admin wants to configure it
  if (!isRunning && !showControls && !showNotification) {
    return isAdmin ? (
      <div className="flex justify-end mb-2">
        <button
          onClick={() => { setShowControls(true); resetNotificationState(); }}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
          title="Start Timer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v18l15-9L5 3z" /></svg>
          Start
        </button>
      </div>
    ) : null;
  }  // Show notification when timer ends
  if (showNotification) {
    return (
      <div
        className={`fixed top-4 left-1/2 z-50 min-w-[320px] transition-all duration-500 ease-out transform -translate-x-1/2
          ${notificationVisible && !notificationExiting 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'}`
        }
        style={{ pointerEvents: notificationExiting ? 'none' : 'auto' }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-blue-500/20">
          <div className="bg-white/20 rounded-full p-2">
            <svg className="w-6 h-6 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-base font-bold">Timer Complete</div>
            <div className="text-sm text-blue-100 opacity-90">The voting timer has ended.</div>
          </div>
          <button
            onClick={() => {
              setNotificationExiting(true);
              if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
            }}
            className="ml-2 p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            title="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };  const startTimer = async () => {
    if (!isAdmin) return;
    resetNotificationState();
    
    const minutes = parseInt(timeInput) || 5;
    const duration = minutes * 60; // duration in seconds
    
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        timer: {
          startTime: Date.now(),
          duration: duration,
          isRunning: true
        }
      });
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };  const resetTimer = async () => {
    if (!isAdmin) return;
    resetNotificationState();
    setWasRunning(false);
    
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        timer: {
          startTime: null,
          duration: 0,
          isRunning: false
        }
      });
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  const addTime = async (minutes: number) => {
    if (!isAdmin || !room.timer || !room.timer.isRunning) return;
    
    const additionalSeconds = minutes * 60;
    const newDuration = room.timer.duration + additionalSeconds;
    
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        timer: {
          ...room.timer,
          duration: newDuration
        }
      });
    } catch (error) {
      console.error('Error adding time:', error);
    }
  };

  // Determine timer display color based on remaining time
  const getTimerColor = () => {
    if (remainingTime <= 30) return 'text-red-600 dark:text-red-400';
    if (remainingTime <= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getTimerBgColor = () => {
    if (remainingTime <= 30) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (remainingTime <= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  return (
    <div className={`p-4 rounded-lg border shadow transition-all duration-300 ${
      isRunning 
        ? getTimerBgColor()
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Timer Icon */}
          <div className={`p-2 rounded-full ${
            isRunning 
              ? remainingTime <= 30 
                ? 'bg-red-100 dark:bg-red-900/30'
                : remainingTime <= 60
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <svg className={`w-5 h-5 ${
              isRunning ? getTimerColor() : 'text-gray-500 dark:text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Timer Display */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Voting Timer</h3>
            <div className="flex items-center gap-2">              {isRunning ? (
                <span className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
                  {formatTime(remainingTime)}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  {room.timer && room.timer.startTime ? 'Timer ended' : 'No timer active'}
                </span>
              )}         
            </div>
          </div>
        </div>        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                <input
                  type="number"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  min="1"
                  max="60"
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5"
                  aria-label="Timer minutes"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                <button
                  onClick={startTimer}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                  title="Start Timer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v18l15-9L5 3z" /></svg>
                  Start
                </button>
                <button
                  onClick={() => setShowControls(false)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                <button
                  onClick={() => addTime(1)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title="Add 1 minute"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  +1m
                </button>
                <button
                  onClick={() => addTime(2)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title="Add 2 minutes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  +2m
                </button>
                <button
                  onClick={resetTimer}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Stop Timer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  Stop
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timer Progress Bar */}
      {isRunning && room.timer && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                remainingTime <= 30 ? 'bg-red-500' :
                remainingTime <= 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.max(0, (remainingTime / room.timer.duration) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Timer Status Text */}
      {/* {isRunning && (
        <div className="mt-2 text-center">
          <p className={`text-sm ${getTimerColor()}`}>
            {remainingTime <= 30 
              ? '⚠️ Time running out!'
              : remainingTime <= 60
                ? '⏰ One minute remaining'
                : '⏱️ Timer is running'
            }
          </p>
        </div>
      )} */}
    </div>
  );
}
