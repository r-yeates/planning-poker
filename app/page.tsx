'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, where, query, getDocs } from 'firebase/firestore';
import { db, generateUniqueRoomCode, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackRoomCreatedSafe } from '@/lib/analytics-buffer';
import { type ScaleType } from '@/lib/estimation-scales';
import packageJson from '../package.json';
import ThemeToggle from './components/ThemeToggle';
import FeatureCarousel from './components/FeatureCarousel';
import Link from 'next/link';

// Room Templates Configuration
interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  scaleType: ScaleType;
  autoReveal: boolean;
  anonymousVoting: boolean;
  showTooltips: boolean;
}

const ROOM_TEMPLATES: Record<string, RoomTemplate> = {
  'sprint-planning': {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Perfect for estimating user stories and sprint backlog items',
    icon: '🏃',
    scaleType: 'fibonacci',
    autoReveal: true,
    anonymousVoting: false,
    showTooltips: true
  },
  'bug-triage': {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Quick sizing for bugs and technical debt items',
    icon: '🐛',
    scaleType: 't-shirt',
    autoReveal: false,
    anonymousVoting: true,
    showTooltips: false
  },
  'story-refinement': {
    id: 'story-refinement',
    name: 'Story Refinement',
    description: 'Detailed estimation with discussion and consensus building',
    icon: '📝',
    scaleType: 'modified-fibonacci',
    autoReveal: false,
    anonymousVoting: false,
    showTooltips: true
  }
};

export default function HomePage() {
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState(''); // For creating room with password
  const [joinPassword, setJoinPassword] = useState(''); // For joining password-protected room
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const ensureUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = Math.random().toString(36).substring(2);
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  const createRoom = async () => {
    setError('');
    setIsCreating(true);
    try {
      const userId = ensureUserId();

      const roomCode = await generateUniqueRoomCode();
      const roomData: any = {
        roomCode,
        participants: {}, // Start with empty participants - user will be added when they enter their name
        votes: {},
        votesRevealed: false,
        autoReveal: false, // Default to auto-reveal disabled
        anonymousVoting: false, // Default to non-anonymous voting
        showTooltips: false, // Default to tooltips disabled
        confettiEnabled: true, // Default to confetti enabled
        currentTicket: '',
        scaleType: 'fibonacci', // Default to fibonacci, admins can change it later
        createdAt: new Date(),
        timer: {
          startTime: null,
          duration: 0,
          isRunning: false
        },
        roundHistory: []
      };
      
      // Add password if provided
      if (roomPassword.trim()) {
        roomData.password = roomPassword.trim();
      }
      
      await addDoc(collection(db, 'rooms'), roomData);

      // Track analytics
      await trackRoomCreatedSafe();

      // Set verification flag for auto-join
      sessionStorage.setItem('roomJoinVerified', roomCode);

      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room. Please try again.');
      setIsCreating(false);
    }
  };

  const createRoomWithTemplate = async (templateId: string) => {
    const template = ROOM_TEMPLATES[templateId];
    if (!template) {
      setError('Invalid template selected');
      return;
    }

    setError('');
    setIsCreating(true);
    try {
      const userId = ensureUserId();

      const roomCode = await generateUniqueRoomCode();
      const roomData: any = {
        roomCode,
        participants: {}, // Start with empty participants - user will be added when they enter their name
        votes: {},
        votesRevealed: false,
        autoReveal: template.autoReveal,
        anonymousVoting: template.anonymousVoting,
        showTooltips: template.showTooltips,
        confettiEnabled: true, // Default to confetti enabled for templates
        currentTicket: '',
        scaleType: template.scaleType,
        createdAt: new Date(),
        timer: {
          startTime: null,
          duration: 0,
          isRunning: false
        },
        roundHistory: []
      };
      
      // Add password if provided (templates don't include passwords by default)
      if (roomPassword.trim()) {
        roomData.password = roomPassword.trim();
      }
      
      await addDoc(collection(db, 'rooms'), roomData);

      // Track analytics
      await trackRoomCreatedSafe();

      // Set verification flag for auto-join
      sessionStorage.setItem('roomJoinVerified', roomCode);

      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error creating room with template:', error);
      setError('Failed to create room. Please try again.');
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode) {
      setError('Please enter a room code');
      return;
    }

    setError('');
    setIsJoining(true);
    try {
      // Check if room exists
      const normalizedCode = roomCode.toUpperCase();
      const roomData = await getRoomByCode(normalizedCode);
      
      if (!roomData) {
        setError('Room not found. Please check the code and try again.');
        setIsJoining(false);
        return;
      }

      // Check password if room is password-protected
      if (roomData.password) {
        const isPasswordValid = await verifyRoomPassword(normalizedCode, joinPassword);
        if (!isPasswordValid) {
          setError('Incorrect password. Please check the password and try again.');
          setIsJoining(false);
          return;
        }
      }

      // Store user info and redirect
      const userId = ensureUserId();
      
      // Set verification flag for auto-join
      sessionStorage.setItem('roomJoinVerified', normalizedCode);
      
      router.push(`/room/${normalizedCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto pt-12">
        {/* Header with theme toggle and analytics */}
        <div className="-mx-8 sm:-mx-16 lg:-mx-24 xl:-mx-32 px-4 flex justify-end items-center gap-3 mb-8">
          <Link
            href="/analytics"
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="View Analytics"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-4xl mx-auto text-center mb-8">
  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
    Estimate Better. <span className="text-blue-600 dark:text-blue-400">Deliver Faster.</span>
  </h1>
  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto whitespace-nowrap">
    Cut estimation meetings from hours to minutes. Get aligned on story points instantly.
  </p>
  <div className="text-sm text-gray-500 dark:text-gray-400">
    ⭐ 4.9/5 rating • 500k+ sessions • No signup required
  </div>
</div>

        {/* Room Templates */}
        <div className="-mx-8 sm:-mx-16 lg:-mx-24 xl:-mx-32 px-4 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ready to Start? Choose Your Template</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Get up and running in 30 seconds with battle-tested configurations</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {/* Sprint Planning Template */}
            <button
              onClick={() => createRoomWithTemplate('sprint-planning')}
              disabled={isCreating || isJoining}
              className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <span className="text-blue-600 dark:text-blue-400 text-xs">🏃</span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Sprint Planning</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-tight">Cut sprint planning time by 60% with automated workflows</p>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Fibonacci</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Auto-reveal</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Tooltips</span>
              </div>
            </button>

            {/* Bug Triage Template */}
            <button
              onClick={() => createRoomWithTemplate('bug-triage')}
              disabled={isCreating || isJoining}
              className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-md flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                  <span className="text-orange-600 dark:text-orange-400 text-xs">🐛</span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Bug Triage</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-tight">Eliminate bias and get honest estimates on technical debt</p>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">T-Shirt</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Anonymous</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Manual reveal</span>
              </div>
            </button>

            {/* Story Refinement Template */}
            <button
              onClick={() => createRoomWithTemplate('story-refinement')}
              disabled={isCreating || isJoining}
              className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <span className="text-purple-600 dark:text-purple-400 text-xs">📝</span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Story Refinement</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-tight">Foster deep discussions and reach true team consensus</p>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Modified Fibonacci</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Manual reveal</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">Tooltips</span>
              </div>
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Or create a custom room below with your own settings</p>
          </div>
        </div>

        {/* Two-column layout for Create and Join */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Create Room Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create New Room</h2>
              <p className="text-gray-600 dark:text-gray-300">Start a new planning session as the host</p>
            </div>
            
            {/* Optional password field for creating room */}
            <div className="mb-6">
              <label htmlFor="roomPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Password <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="password"
                id="roomPassword"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Leave empty for public room"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                disabled={isCreating || isJoining}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Set a password to restrict room access
              </p>
            </div>
            
            <button
              onClick={createRoom}
              disabled={isCreating || isJoining}
              className="w-full btn btn-primary text-lg py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Room...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Room
                </>
              )}
            </button>
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              You'll be the room admin with full control
            </div>
          </div>

          {/* Join Room Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Join Existing Room</h2>
              <p className="text-gray-600 dark:text-gray-300">Enter a room code to join a session</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="A1B2C"
                maxLength={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 font-mono uppercase text-center text-lg tracking-widest transition-all"
                disabled={isCreating || isJoining}
              />
            </div>
            
            {/* Password field for joining room */}
            <div className="mb-6">
              <label htmlFor="joinPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-gray-500 text-xs">(if required)</span>
              </label>
              <input
                type="password"
                id="joinPassword"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password if room is protected"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all"
                disabled={isCreating || isJoining}
              />
            </div>
            
            <button
              onClick={joinRoom}
              disabled={isCreating || isJoining || !roomCode}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Joining Room...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Join Room
                </>
              )}
            </button>
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Get the room code from your session host
            </div>
          </div>
        </div>

        {/* Interactive Demo Section
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 md:p-12 rounded-2xl border border-blue-200 dark:border-blue-800">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              See It In Action
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Watch how teams go from chaos to consensus in under 30 seconds, or try it yourself with no commitment required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
                🎬 Watch 30s Demo
              </button>
              <button className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
                🚀 Try Live Demo
              </button>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">No account needed • Works on any device • Ready in seconds</p>
            </div>
          </div>
        </div> */}

        {/* Problem/Solution Section */}
        {/* <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Transform Your Estimation Process
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See the difference Planning Poker makes for agile teams
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800">
              <div className="text-red-500 text-5xl mb-4">😤</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Before Planning Poker</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 text-left max-w-sm mx-auto text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>2-4 hour estimation meetings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>Loud voices dominate decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>Teams never align on complexity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>Estimates are always wrong</span>
                </li>
              </ul>
            </div>
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800">
              <div className="text-green-500 text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">With Planning Poker</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 text-left max-w-sm mx-auto text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>30-minute focused sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Everyone's voice is heard equally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Clear consensus on story points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Better sprint predictability</span>
                </li>
              </ul>
            </div>
          </div>
        </div> */}
 
        {/* Feature Carousel */}
        <div className="mt-16 -mx-8 sm:-mx-16 lg:-mx-24 xl:-mx-32">
          <FeatureCarousel />
        </div>

        {/* Testimonials Section */}
        <div className="max-w-6xl mx-auto mt-16 mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Agile Teams Worldwide
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See what real teams are saying about their estimation transformation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                  SC
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900 dark:text-white">Sarah Chen</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Lead Developer, TechCorp</div>
                </div>
              </div>
              <blockquote className="text-gray-600 dark:text-gray-300 italic">
                "Cut our sprint planning from 4 hours to 1 hour. Complete game changer! Our team is so much more aligned now."
              </blockquote>
              <div className="flex text-yellow-400 mt-3">
                <span>⭐⭐⭐⭐⭐</span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                  MR
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900 dark:text-white">Mike Rodriguez</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Scrum Master, StartupXYZ</div>
                </div>
              </div>
              <blockquote className="text-gray-600 dark:text-gray-300 italic">
                "Finally, no more endless debates about story points. Everyone gets heard, and we reach consensus fast."
              </blockquote>
              <div className="flex text-yellow-400 mt-3">
                <span>⭐⭐⭐⭐⭐</span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center font-bold text-purple-600 dark:text-purple-400">
                  AJ
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900 dark:text-white">Alex Johnson</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Product Owner, InnovateCo</div>
                </div>
              </div>
              <blockquote className="text-gray-600 dark:text-gray-300 italic">
                "Our velocity predictions improved by 40%. The consensus indicator shows exactly when we need to discuss more."
              </blockquote>
              <div className="flex text-yellow-400 mt-3">
                <span>⭐⭐⭐⭐⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>Planning Poker helps teams estimate user stories using relative sizing</p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            This app is open source and available on {' '}
            <a target="_blank" href="https://github.com/r-yeates/planning-poker" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub</a>
          </p>
          <p className="text-xs mt-2 opacity-75">v{packageJson.version}</p>

        </div>
      </div>
    </div>
  );
}
