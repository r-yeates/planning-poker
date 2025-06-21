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
import TextTransition, { presets } from 'react-text-transition';

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

  // Text transition states (only for hero)
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  
  const heroTexts = [
    'Real-time collaborative estimation for agile teams.',
    'Eliminate estimation bias with anonymous voting.',
    'Cut planning meetings from hours to minutes.',
    'Get better velocity predictions with data insights.'
  ];

  // Text transition effect (only for hero)
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTextIndex((current) => (current + 1) % heroTexts.length);
    }, 3500); // Change every 3.5 seconds
    return () => clearInterval(interval);
  }, [heroTexts.length]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">PP</span>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">Planning Poker</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section with Cards Visual */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="text-center mb-16">
          
          <h1 className="text-5xl md:text-7xl font-bold">
            <span className="text-gray-900 dark:text-white">Plan</span>
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"> Together</span>
          </h1>
          
          <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-16 h-16 flex items-center justify-center overflow-hidden">
            <TextTransition springConfig={presets.gentle} className="text-center whitespace-nowrap">
              {heroTexts[heroTextIndex]}
            </TextTransition>
          </div>

          {/* Floating Cards Animation */}
          <div className="relative max-w-md mx-auto mb-16">
            <div className="grid grid-cols-5 gap-2 transform rotate-6">
              {['1', '2', '3', '5', '8'].map((value, index) => (
                <div 
                  key={value}
                  className={`aspect-[3/4] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold text-lg animate-bounce`}
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    animationDuration: '2s'
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-100/20 dark:to-blue-900/20 pointer-events-none"></div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="relative mb-24">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="h-full">
              <defs>
                <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1" fill="currentColor"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)"/>
            </svg>
          </div>

          <div className="relative">
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Choose Your <span className="text-blue-600 dark:text-blue-400">Style</span>
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Select the perfect estimation approach for your team's workflow
              </p>
            </div>

            {/* Template Selection */}
            <div className="grid lg:grid-cols-3 gap-6 mb-20">
              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <button
                  onClick={() => createRoomWithTemplate('sprint-planning')}
                  disabled={isCreating || isJoining}
                  className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left h-full flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
                      🏃‍♂️
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Planning</h4>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                    Perfect for estimating user stories with your team. Auto-reveal cards when everyone votes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">Fibonacci Scale</span>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">Auto Reveal</span>
                  </div>
                </button>
              </div>

              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <button
                  onClick={() => createRoomWithTemplate('bug-triage')}
                  disabled={isCreating || isJoining}
                  className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-orange-100 dark:border-orange-900 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left h-full flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
                      🐛
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Bug Triage</h4>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                    Quick sizing for bugs and technical debt. Anonymous voting prevents bias.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">T-Shirt Sizes</span>
                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">Anonymous</span>
                  </div>
                </button>
              </div>

              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <button
                  onClick={() => createRoomWithTemplate('story-refinement')}
                  disabled={isCreating || isJoining}
                  className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left h-full flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
                      📝
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Story Refinement</h4>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                    Deep discussions and consensus building. Manual reveal for thoughtful estimation.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">Modified Fibonacci</span>
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">Manual Reveal</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Room Creation */}
            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></div>
                  <span className="text-lg font-medium text-gray-500 dark:text-gray-400">Or go custom</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></div>
                </div>
                <h4 className="text-3xl font-bold text-gray-900 dark:text-white">Build Your Own Room</h4>
              </div>

              <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12">
                {/* Create Custom Room */}
                <div className="group relative h-full">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
                  <div className="relative bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Host a Room</h3>
                      <p className="text-gray-600 dark:text-gray-300">Take control and lead the session</p>
                    </div>
                    
                    <div className="space-y-6 flex-grow">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          🔒 Password Protection <span className="font-normal text-gray-500">(optional)</span>
                        </label>
                        <input
                          type="password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                          placeholder="Keep it secret, keep it safe"
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
                          disabled={isCreating || isJoining}
                        />
                      </div>
                      
                      <button
                        onClick={createRoom}
                        disabled={isCreating || isJoining}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold py-5 rounded-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                      >
                        {isCreating ? (
                          <>
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Summoning Room...
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">⚡</span>
                            Create & Lead
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Join Existing Room */}
                <div className="group relative h-full">
                  <div className="absolute -inset-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
                  <div className="relative bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join the Action</h3>
                      <p className="text-gray-600 dark:text-gray-300">Drop into an existing session</p>
                    </div>
                    
                    <div className="space-y-6 flex-grow">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          🎯 Room Code
                        </label>
                        <input
                          type="text"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                          placeholder="ABC12"
                          maxLength={5}
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:bg-white dark:focus:bg-gray-700 font-mono text-center text-2xl tracking-[0.5em] transition-all duration-200"
                          disabled={isCreating || isJoining}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          🔐 Password <span className="font-normal text-gray-500">(if needed)</span>
                        </label>
                        <input
                          type="password"
                          value={joinPassword}
                          onChange={(e) => setJoinPassword(e.target.value)}
                          placeholder="Secret handshake"
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
                          disabled={isCreating || isJoining}
                        />
                      </div>
                      
                      <button
                        onClick={joinRoom}
                        disabled={isCreating || isJoining || !roomCode}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-bold py-5 rounded-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                      >
                        {isJoining ? (
                          <>
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Joining...
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">🚀</span>
                            Jump In
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
 
        {/* Why Teams Love It Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">

              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gray-900 dark:text-white">Stop the</span>
                <span className="text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text"> Estimation</span>
                <br />
                <span className="text-transparent bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text">Chaos</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Real teams share how Planning Poker transformed their sprints from painful marathons into focused power sessions
              </p>
            </div>

            {/* Feature Carousel Replacement - Interactive Cards */}
            <div className="mb-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast Consensus</h3>
                      <p className="text-gray-600 dark:text-gray-300">No more 3-hour meetings. Get aligned in minutes with simultaneous voting that prevents anchoring bias.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">🎭</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Anonymous Mode</h3>
                      <p className="text-gray-600 dark:text-gray-300">Level the playing field. Junior devs get the same voice as seniors when estimates are hidden until reveal.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Analytics</h3>
                      <p className="text-gray-600 dark:text-gray-300">Track velocity trends, spot estimation patterns, and improve your team's predictability over time.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">🎉</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Celebration Mode</h3>
                      <p className="text-gray-600 dark:text-gray-300">Confetti explosions when consensus is reached. Because estimation wins should feel like wins!</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 font-mono">planning-poker.live</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">SC</div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Sarah is estimating...</span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2 mb-6">
                        {['1', '2', '3', '5', '8'].map((value, index) => (
                          <div 
                            key={value}
                            className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg hover:scale-105 transition-transform duration-200 cursor-pointer"
                            style={{ 
                              animationDelay: `${index * 0.1}s`,
                            }}
                          >
                            {value}
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <span className="text-lg">🎉</span>
                          <span className="font-medium">Consensus reached! Story estimated at 5 points.</span>
                        </div>
                      </div>
                    </div>
                  </div>
      
                </div>
              </div>
            </div>

            {/* Social Proof - Redesigned Testimonials */}
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Real Teams, Real Results
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
                From chaotic estimation meetings to smooth, predictable planning sessions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Testimonial 1 - Redesigned */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">SC</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900 dark:text-white">Sarah Chen</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lead Developer, TechCorp</div>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">6 months ago</span>
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "Absolute game changer! Cut our sprint planning from <span className="bg-red-100 dark:bg-red-900/30 px-1 rounded text-red-700 dark:text-red-300">4 painful hours</span> to <span className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-green-700 dark:text-green-300">1 focused hour</span>. Team alignment is through the roof."
                  </blockquote>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Team of 8 developers</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">75% time saved</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 - Redesigned */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">MR</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900 dark:text-white">Mike Rodriguez</div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">Scrum Master, StartupXYZ</div>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">3 months ago</span>
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "Finally, no more endless debates! Everyone gets heard equally, and we reach consensus <span className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700 dark:text-blue-300">lightning fast</span>. Silent voting is pure magic."
                  </blockquote>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Cross-functional team</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">100% consensus rate</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 - Redesigned */}
              <div className="relative group md:col-span-2 lg:col-span-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">AJ</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900 dark:text-white">Alex Johnson</div>
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Product Owner, InnovateCo</div>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">2 weeks ago</span>
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "Velocity predictions improved by <span className="bg-purple-100 dark:bg-purple-900/30 px-1 rounded text-purple-700 dark:text-purple-300 font-bold">40%</span>! The consensus indicator shows exactly when we need to discuss more. Data-driven estimation at its finest."
                  </blockquote>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Product team of 12</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">40% accuracy boost</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-full text-white font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <span className="text-2xl">🚀</span>
                Join 10,000+ Teams
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No signup required • Free forever • Start in 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
