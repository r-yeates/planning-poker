'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, where, query, getDocs } from 'firebase/firestore';
import { db, generateUniqueRoomCode, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackRoomCreatedSafe } from '@/lib/analytics-buffer';
import { type ScaleType } from '@/lib/estimation-scales';
import packageJson from '../../../package.json';
import ThemeToggle from '../../components/global/ThemeToggle';
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
    icon: '🏃‍♂️',
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
    icon: '🔍',
    scaleType: 'fibonacci',
    autoReveal: false,
    anonymousVoting: false,
    showTooltips: true
  }
};

// Demo data
const DEMO_STORIES = [
  {
    id: 1,
    title: "User Login with Social Auth",
    description: "As a user, I want to login using Google/GitHub so that I can access the app quickly",
    acceptanceCriteria: ["OAuth integration", "Profile sync", "Session management"]
  },
  {
    id: 2,
    title: "Dark Mode Toggle",
    description: "As a user, I want to switch between light and dark themes for better accessibility",
    acceptanceCriteria: ["Theme persistence", "Smooth transitions", "All components support"]
  },
  {
    id: 3,
    title: "API Rate Limiting",
    description: "As a developer, I want to implement rate limiting to prevent API abuse",
    acceptanceCriteria: ["Rate limit headers", "Error responses", "Different limits per endpoint"]
  }
];

const FIBONACCI_CARDS = ['1', '2', '3', '5', '8', '?', '☕'];

export default function DemoHomePage() {
  const router = useRouter();
  const [demoStep, setDemoStep] = useState<'intro' | 'story' | 'voting' | 'reveal' | 'results'>('intro');
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [demoVotes, setDemoVotes] = useState<{[key: string]: string}>({});
  const [myVote, setMyVote] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sprint-planning');
  const [showRealActions, setShowRealActions] = useState(false);

  // Demo participants
  const demoParticipants = [
    { name: 'You', avatar: '👤', role: 'Product Owner' },
    { name: 'Sarah', avatar: '👩‍💻', role: 'Frontend Dev' },
    { name: 'Mike', avatar: '👨‍💻', role: 'Backend Dev' },
    { name: 'Alex', avatar: '🧑‍💻', role: 'Full Stack' },
    { name: 'Lisa', avatar: '👩‍🎨', role: 'UX Designer' }
  ];

  useEffect(() => {
    if (demoStep === 'voting' && Object.keys(demoVotes).length === 0) {
      // Simulate other participants voting with realistic delays
      const timers: NodeJS.Timeout[] = [];
      
      // Sarah votes first (quick)
      timers.push(setTimeout(() => {
        setDemoVotes(prev => ({...prev, 'Sarah': '5'}));
      }, 1500));
      
      // Mike votes second (thoughtful)
      timers.push(setTimeout(() => {
        setDemoVotes(prev => ({...prev, 'Mike': '8'}));
      }, 3000));
      
      // Alex votes third (confident)
      timers.push(setTimeout(() => {
        setDemoVotes(prev => ({...prev, 'Alex': '13'}));
      }, 4200));
      
      // Lisa votes last (careful consideration)
      timers.push(setTimeout(() => {
        setDemoVotes(prev => ({...prev, 'Lisa': '3'}));
      }, 5800));
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [demoStep]);

  const handleCreateRoom = async (templateId?: string) => {
    setIsCreating(true);
    try {
      const roomCode = await generateUniqueRoomCode();
      const template = templateId ? ROOM_TEMPLATES[templateId] : ROOM_TEMPLATES[selectedTemplate];
      
      const roomData = {
        code: roomCode,
        name: roomName || `${template.name} Session`,
        password: password || null,
        scaleType: template.scaleType,
        autoReveal: template.autoReveal,
        anonymousVoting: template.anonymousVoting,
        showTooltips: template.showTooltips,
        createdAt: new Date(),
        isActive: true,
        participants: [],
        currentStory: null,
        votes: {},
        revealedAt: null
      };

      await addDoc(collection(db, 'rooms'), roomData);
      await trackRoomCreatedSafe();
      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    
    setIsJoining(true);
    try {
      const room = await getRoomByCode(joinCode.toUpperCase());
      
      if (!room) {
        alert('Room not found. Please check the room code.');
        return;
      }

      if (room.password) {
        const isValidPassword = await verifyRoomPassword(joinCode.toUpperCase(), joinPassword);
        if (!isValidPassword) {
          alert('Incorrect password. Please try again.');
          return;
        }
      }

      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Error joining room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const startDemo = () => {
    setDemoStep('story');
    setCurrentStoryIndex(0);
    setDemoVotes({});
    setMyVote('');
    setIsRevealed(false);
  };

  const handleDemoVote = (vote: string) => {
    setMyVote(vote);
    setDemoStep('reveal');
    
    // Auto-reveal after a short delay
    setTimeout(() => {
      setIsRevealed(true);
      setTimeout(() => {
        setDemoStep('results');
      }, 2000);
    }, 1000);
  };

  const nextStory = () => {
    if (currentStoryIndex < DEMO_STORIES.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setDemoStep('story');
      setDemoVotes({});
      setMyVote('');
      setIsRevealed(false);
    } else {
      setDemoStep('intro');
      setShowRealActions(true);
    }
  };

  const currentStory = DEMO_STORIES[currentStoryIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Sprintro Logo" className="w-10 h-10 rounded-xl" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Sprintro</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/blog" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Blog</Link>
            <Link href="/faq" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</Link>
            <Link href="/analytics" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Analytics</Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">Planning Poker</span>
            <br />
            <span className="text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text">
              Made Simple
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            Experience the future of agile estimation. Try our interactive demo below, 
            then create your own room in seconds.
          </p>
          
          {!showRealActions && (
            <button
              onClick={startDemo}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Interactive Demo
            </button>
          )}
        </div>

        {/* Interactive Demo Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            
            {/* Demo Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="ml-4 font-semibold">Planning Poker Demo - Room ABC123</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  5 participants
                </div>
              </div>
            </div>

            {/* Demo Content */}
            <div className="p-8">
              
              {/* Demo Intro */}
              {demoStep === 'intro' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">🎯</div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Ready to estimate like a pro?
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                    Experience a real planning poker session. We'll walk you through estimating 
                    user stories with your virtual team.
                  </p>
                  {!showRealActions ? (
                    <button
                      onClick={startDemo}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                    >
                      Start Demo →
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                        🎉 Demo Complete! Ready to create your own room?
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => handleCreateRoom('sprint-planning')}
                          disabled={isCreating}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
                        >
                          {isCreating ? 'Creating...' : 'Create Real Room'}
                        </button>
                        <button
                          onClick={() => {setShowRealActions(false); startDemo();}}
                          className="border-2 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-8 py-3 rounded-xl font-semibold transition-colors"
                        >
                          Try Demo Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Story Presentation */}
              {demoStep === 'story' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                      Story {currentStoryIndex + 1} of {DEMO_STORIES.length}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {currentStory.title}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
                      {currentStory.description}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Acceptance Criteria:</h4>
                    <ul className="space-y-2">
                      {currentStory.acceptanceCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setDemoStep('voting')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                    >
                      Start Voting →
                    </button>
                  </div>
                </div>
              )}

              {/* Voting Phase */}
              {demoStep === 'voting' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Vote for: {currentStory.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Select your estimate from the cards below
                    </p>
                  </div>              {/* Participants */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                {demoParticipants.map((participant, index) => {
                  const hasVoted = participant.name === 'You' ? myVote : demoVotes[participant.name];
                  const isThinking = participant.name !== 'You' && !demoVotes[participant.name];
                  
                  return (
                    <div key={index} className="text-center">
                      <div className={`w-16 h-20 rounded-xl border-2 flex items-center justify-center mb-2 transition-all duration-500 ${
                        hasVoted
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                          : participant.name === 'You'
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}>
                        {hasVoted ? (
                          <div className="text-center">
                            <div className="w-10 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center animate-pulse">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        ) : isThinking ? (
                          <div className="text-center">
                            <div className="text-xl animate-bounce">{participant.avatar}</div>
                            <div className="flex gap-1 mt-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-2xl">{participant.avatar}</div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{participant.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</div>
                      {hasVoted && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                          Voted ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

                  {/* Voting Cards */}
                  {!myVote && (
                    <div>
                      <h4 className="text-center font-semibold text-gray-900 dark:text-white mb-4">Choose your estimate:</h4>
                      <div className="grid grid-cols-7 gap-4 max-w-lg mx-auto">
                        {FIBONACCI_CARDS.map((card) => (
                          <button
                            key={card}
                            onClick={() => handleDemoVote(card)}
                            className="aspect-[3/4] bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white transform hover:scale-105 hover:-translate-y-1"
                          >
                            {card}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        💡 Tip: Choose based on complexity, effort, and potential unknowns
                      </p>
                    </div>
                  )}

                  {myVote && (
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-6 py-3 rounded-full font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        You voted: <span className="font-bold text-xl">{myVote}</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          ⏳ Waiting for other team members...
                        </p>
                        <div className="flex justify-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                      
                      {/* Show reveal button when all have voted */}
                      {Object.keys(demoVotes).length === 4 && (
                        <button
                          onClick={() => {setDemoStep('reveal'); setTimeout(() => setIsRevealed(true), 1000); setTimeout(() => setDemoStep('results'), 3000);}}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 animate-pulse"
                        >
                          🎲 Reveal All Votes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reveal Phase */}
              {demoStep === 'reveal' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Revealing votes...
                    </h3>
                    <div className="animate-pulse text-indigo-600 dark:text-indigo-400">
                      <div className="text-4xl mb-2">🎲</div>
                      <p>Drumroll please...</p>
                    </div>
                  </div>

                  {/* Participants with votes being revealed */}
                  <div className="grid grid-cols-5 gap-4">
                    {demoParticipants.map((participant, index) => (
                      <div key={index} className="text-center">
                        <div className={`w-16 h-20 rounded-xl border-2 flex items-center justify-center mb-2 transition-all ${
                          isRevealed 
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        }`}>
                          {isRevealed ? (
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {participant.name === 'You' ? myVote : demoVotes[participant.name]}
                            </span>
                          ) : (
                            <div className="w-8 h-10 bg-indigo-500 rounded animate-pulse"></div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{participant.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Phase */}
              {demoStep === 'results' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Voting Results
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Here's how everyone estimated: <strong>{currentStory.title}</strong>
                    </p>
                  </div>

                  {/* Results visualization */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6">
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      {demoParticipants.map((participant, index) => {
                        const vote = participant.name === 'You' ? myVote : demoVotes[participant.name];
                        return (
                          <div key={index} className="text-center">
                            <div className="w-16 h-20 rounded-xl border-2 border-blue-300 bg-white dark:bg-gray-700 flex items-center justify-center mb-2 shadow-md">
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {vote}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{participant.name}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Voting Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                      {(() => {
                        const allVotes = [myVote, ...Object.values(demoVotes)].map(v => parseInt(v || '0')).filter(v => !isNaN(v));
                        const min = Math.min(...allVotes);
                        const max = Math.max(...allVotes);
                        const avg = Math.round(allVotes.reduce((a, b) => a + b, 0) / allVotes.length);
                        const range = max - min;
                        
                        return (
                          <>
                            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{min}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Minimum</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{max}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Maximum</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avg}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Average</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{range}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Range</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Team alignment: {(() => {
                          const votes = [myVote, ...Object.values(demoVotes)].map(v => parseInt(v || '0')).filter(v => !isNaN(v));
                          const range = Math.max(...votes) - Math.min(...votes);
                          return range <= 5 ? 'Strong consensus 🎯' : range <= 8 ? 'Good agreement 👍' : 'Needs discussion 💬';
                        })()}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {(() => {
                          const votes = [myVote, ...Object.values(demoVotes)].map(v => parseInt(v || '0')).filter(v => !isNaN(v));
                          const range = Math.max(...votes) - Math.min(...votes);
                          if (range <= 5) return "Excellent! The team is aligned on complexity. Ready to commit to this estimate.";
                          if (range <= 8) return "Good consensus. A quick discussion might help refine the final estimate.";
                          return "Wide range of estimates. Time for team discussion to understand different perspectives.";
                        })()}
                      </p>
                      
                      <button
                        onClick={nextStory}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
                      >
                        {currentStoryIndex < DEMO_STORIES.length - 1 ? '➡️ Next Story' : '🎉 Finish Demo'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Always Visible Action Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Start Your Own Session?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Create your own room or join an existing session to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Room */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Room</h3>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Room name (optional)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <input
                  type="password"
                  placeholder="Password (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                />

                <div className="grid grid-cols-3 gap-3">
                  {Object.values(ROOM_TEMPLATES).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 border-2 rounded-xl transition-all ${
                        selectedTemplate === template.id
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">{template.name}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCreateRoom()}
                  disabled={isCreating}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all"
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>

            {/* Join Room */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Join Existing Room</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 text-center font-mono text-lg tracking-widest transition-colors"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password (if required)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={!joinCode.trim() || isJoining}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real Action Section (shown after demo completion) */}
        {showRealActions && (
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                🎉 Demo Complete!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                You've experienced planning poker in action. Ready for the real thing?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Quick Create */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-700">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Start</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Create a room instantly with optimal settings based on the demo you just experienced
                  </p>
                  <button
                    onClick={() => handleCreateRoom('sprint-planning')}
                    disabled={isCreating}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all"
                  >
                    {isCreating ? 'Creating...' : '🚀 Create Sprint Planning Room'}
                  </button>
                </div>
              </div>

              {/* Try Again */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border-2 border-indigo-200 dark:border-indigo-700">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Try Demo Again</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Want to explore different scenarios or show the demo to your team?
                  </p>
                  <button
                    onClick={() => {setShowRealActions(false); startDemo();}}
                    className="w-full py-3 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold rounded-xl transition-all"
                  >
                    🔄 Restart Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Lightning Fast',
              description: 'Start estimating in under 10 seconds. No accounts, no setup.'
            },
            {
              icon: '🔒',
              title: 'Privacy First',
              description: 'Anonymous voting, optional passwords, automatic cleanup.'
            },
            {
              icon: '📱',
              title: 'Works Everywhere',
              description: 'Perfect on mobile, tablet, or desktop. No downloads needed.'
            }
          ].map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <Link href="/blog" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Blog</Link>
            <Link href="/faq" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">FAQ</Link>
            <Link href="/analytics" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Analytics</Link>
            <Link href="/legal" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Legal</Link>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © 2025 Sprintro. Making planning poker effortless for agile teams worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}
