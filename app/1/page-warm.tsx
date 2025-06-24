'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db, generateUniqueRoomCode, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackRoomCreatedSafe } from '@/lib/analytics-buffer';
import { type ScaleType } from '@/lib/estimation-scales';
import ThemeToggle from '../components/ThemeToggle';
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
    description: 'Perfect for estimating user stories with your team',
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
    icon: '📝',
    scaleType: 'modified-fibonacci',
    autoReveal: false,
    anonymousVoting: false,
    showTooltips: true
  }
};

export default function HomePage() {
  const router = useRouter();
  const [roomPassword, setRoomPassword] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Hero text rotation
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  const heroTexts = [
    "Remove estimation bias with simultaneous reveals",
    "Turn 3-hour meetings into 30-minute power sessions", 
    "Get team consensus faster with proven techniques",
    "Make every voice heard with anonymous voting options"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroTexts.length]);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const roomCode = await generateUniqueRoomCode();
      const roomData = {
        code: roomCode,
        name: `Planning Session`,
        password: roomPassword || null,
        scaleType: 'fibonacci' as ScaleType,
        autoReveal: true,
        anonymousVoting: false,
        showTooltips: true,
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

  const createRoomWithTemplate = async (templateId: string) => {
    setIsCreating(true);
    try {
      const roomCode = await generateUniqueRoomCode();
      const template = ROOM_TEMPLATES[templateId];
      
      const roomData = {
        code: roomCode,
        name: `${template.name} Session`,
        password: roomPassword || null,
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

  const joinRoom = async () => {
    if (!roomCode.trim()) return;
    
    setIsJoining(true);
    try {
      const room = await getRoomByCode(roomCode.toUpperCase());
      
      if (!room) {
        alert('Room not found. Please check the room code.');
        return;
      }

      if (room.password) {
        const isValidPassword = await verifyRoomPassword(roomCode.toUpperCase(), joinPassword);
        if (!isValidPassword) {
          alert('Incorrect password. Please try again.');
          return;
        }
      }

      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Error joining room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Demo Area Component - Shows planning poker in action with warm theme
  const DemoAreaComponent = () => {
    const [demoPhase, setDemoPhase] = useState<'intro' | 'story' | 'voting' | 'thinking' | 'reveal' | 'results'>('intro');
    const [storyIndex, setStoryIndex] = useState(0);
    const [participantVotes, setParticipantVotes] = useState<Record<string, string>>({});
    const [showVotes, setShowVotes] = useState(false);

    const demoStories = [
      { 
        title: "User Authentication System", 
        description: "Implement secure login and registration with OAuth support",
        estimate: "8"
      },
      { 
        title: "Shopping Cart Feature", 
        description: "Add/remove items, calculate totals, apply discounts",
        estimate: "5"
      },
      { 
        title: "Dark Mode Toggle", 
        description: "Theme switching with user preference persistence",
        estimate: "3"
      }
    ];

    const demoParticipants = [
      { name: 'Sarah', avatar: '👩‍💻', role: 'Frontend Dev', estimate: '5' },
      { name: 'Mike', avatar: '👨‍💻', role: 'Backend Dev', estimate: '5' },
      { name: 'Alex', avatar: '🧑‍💻', role: 'Full Stack', estimate: '8' },
      { name: 'Lisa', avatar: '👩‍🎨', role: 'UX Designer', estimate: '3' },
      { name: 'Tom', avatar: '👨‍🔬', role: 'QA Engineer', estimate: '5' }
    ];

    const currentStory = demoStories[storyIndex];

    // Auto-cycle through demo phases
    useEffect(() => {
      const phases = ['intro', 'story', 'voting', 'thinking', 'reveal', 'results'] as const;
      const currentIndex = phases.indexOf(demoPhase);
      
      let timeout: NodeJS.Timeout;
      
      if (currentIndex < phases.length - 1) {
        const delays = [3000, 4000, 3000, 5000, 2000, 4000]; // Time for each phase
        timeout = setTimeout(() => {
          setDemoPhase(phases[currentIndex + 1]);
        }, delays[currentIndex]);
      } else {
        // Reset to next story or loop back
        timeout = setTimeout(() => {
          const nextStoryIndex = (storyIndex + 1) % demoStories.length;
          setStoryIndex(nextStoryIndex);
          setDemoPhase('intro');
          setParticipantVotes({});
          setShowVotes(false);
        }, 3000);
      }
      
      return () => clearTimeout(timeout);
    }, [demoPhase, storyIndex]);

    // Simulate voting with delays
    useEffect(() => {
      if (demoPhase === 'thinking') {
        const delays = [1500, 2800, 3500, 4200, 5000]; // Staggered voting
        demoParticipants.forEach((participant, index) => {
          setTimeout(() => {
            setParticipantVotes(prev => ({
              ...prev,
              [participant.name]: participant.estimate
            }));
          }, delays[index]);
        });
      } else if (demoPhase === 'reveal') {
        setShowVotes(true);
      } else if (demoPhase === 'intro') {
        setParticipantVotes({});
        setShowVotes(false);
      }
    }, [demoPhase]);

    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-orange-200 dark:border-orange-700 shadow-2xl">
        {/* Browser Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-mono">scrint.dev/room/H7J9M1</span>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            Live Demo
          </div>
        </div>
        
        {/* Demo Content - Fixed Height Container */}
        <div className="min-h-[400px] flex flex-col">
          
          {/* Phase: Intro */}
          {demoPhase === 'intro' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Planning Poker Session Starting...
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Watch how teams estimate user stories collaboratively
                </p>
              </div>
            </div>
          )}

          {/* Phase: Story Presentation */}
          {demoPhase === 'story' && (
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
                <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
                  📋 Current Story
                </h3>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {currentStory.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentStory.description}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  🗣️ Product Owner is explaining the requirements...
                </p>
              </div>
            </div>
          )}

          {/* Phase: Voting Cards */}
          {demoPhase === 'voting' && (
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Choose Your Estimate
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Team members select their estimation cards
                </p>
              </div>
              
              <div className="grid grid-cols-6 gap-3">
                {['1', '2', '3', '5', '8', '13'].map((value, index) => (
                  <div 
                    key={value}
                    className="aspect-[3/4] bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                    style={{ 
                      animation: `cardPulse 2s ease-in-out infinite ${index * 0.1}s`,
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase: Thinking/Voting */}
          {demoPhase === 'thinking' && (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Team is Voting...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Each member chooses their estimate privately
                </p>
              </div>
              
              {/* Participants Grid */}
              <div className="grid grid-cols-5 gap-4">
                {demoParticipants.map((participant, index) => {
                  const hasVoted = participantVotes[participant.name];
                  const isThinking = !hasVoted;
                  
                  return (
                    <div key={participant.name} className="text-center">
                      <div className={`w-16 h-20 rounded-xl border-2 flex items-center justify-center mb-2 transition-all duration-500 ${
                        hasVoted
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-lg' 
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}>
                        {hasVoted ? (
                          <div className="w-10 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-900 dark:text-white">{participant.avatar} {participant.name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{participant.role}</div>
                        {hasVoted && (
                          <div className="text-orange-600 dark:text-orange-400 font-bold mt-1">Voted ✓</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <div className="text-center text-sm">
                  <span className="text-amber-700 dark:text-amber-300">
                    {Object.keys(participantVotes).length}/5 team members have voted
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Phase: Reveal */}
          {(demoPhase === 'reveal' || demoPhase === 'results') && (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {demoPhase === 'reveal' ? '🎲 Revealing Votes...' : '📊 Voting Results'}
                </h3>
              </div>
              
              {/* Results Grid */}
              <div className="grid grid-cols-5 gap-4">
                {demoParticipants.map((participant, index) => (
                  <div key={participant.name} className="text-center">
                    <div className="w-16 h-20 rounded-xl border-2 border-orange-300 bg-white dark:bg-gray-700 flex items-center justify-center mb-2 shadow-md">
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {showVotes ? participant.estimate : '?'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <div className="font-medium text-gray-900 dark:text-white">{participant.avatar} {participant.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{participant.role}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results Analysis */}
              {demoPhase === 'results' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">3-8</div>
                      <div className="text-xs text-orange-800 dark:text-orange-300">Range</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{currentStory.estimate}</div>
                      <div className="text-xs text-amber-800 dark:text-amber-300">Average</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">Good</div>
                      <div className="text-xs text-red-800 dark:text-red-300">Consensus</div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                      <span className="text-lg">🎉</span>
                      <span className="font-medium">Story estimated at {currentStory.estimate} points! Moving to next story...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Demo Progress Indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            {['intro', 'story', 'voting', 'thinking', 'reveal', 'results'].map((phase) => (
              <div
                key={phase}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  phase === demoPhase
                    ? 'bg-orange-500 w-6'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Scrint",
            "description": "Free online planning poker tool for agile teams. Estimate user stories, eliminate bias, and reach consensus faster.",
            "url": "https://scrint.dev",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Any",
            "browserRequirements": "Modern web browser with JavaScript support",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "featureList": [
              "Real-time collaborative estimation",
              "Anonymous voting options", 
              "Multiple estimation scales (Fibonacci, T-Shirt, Powers of Two)",
              "Team consensus analysis",
              "Room templates for different scenarios",
              "No signup required",
              "Mobile responsive design",
              "Dark and light themes"
            ],
            "audience": {
              "@type": "Audience",
              "audienceType": "Agile development teams, Scrum masters, Product owners"
            },
            "creator": {
              "@type": "Organization",
              "name": "Scrint",
              "url": "https://scrint.dev"
            }
          })
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-orange-950 dark:via-red-950 dark:to-amber-950">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-full blur-3xl transform translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-3xl transform translate-y-1/2"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-16 h-16 bg-orange-500/10 transform rotate-45"></div>
        <div className="absolute bottom-32 left-16 w-12 h-12 bg-red-500/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-20 bg-amber-500/10 transform rotate-12"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Scrint Logo" 
            className="w-10 h-10 rounded-xl"
          />
          <span className="font-bold text-xl text-gray-900 dark:text-white">Scrint.dev</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Blog
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FAQ
          </Link>
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
            <span className="text-gray-900 dark:text-white">Estimate</span>
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text"> Smart</span>
          </h1>
          
          <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-16 h-16 flex items-center justify-center overflow-hidden">
            <div className="text-center whitespace-nowrap transition-opacity duration-1000">
              {heroTexts[heroTextIndex]}
            </div>
          </div>

          {/* Floating Cards Animation */}
          <div className="relative max-w-md mx-auto mb-16 z-10">
            <div className="grid grid-cols-5 gap-2">
              {['1', '2', '3', '5', '8'].map((value, index) => (
                <div 
                  key={value}
                  className={`aspect-[3/4] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-orange-200 dark:border-orange-700 flex items-center justify-center font-bold text-lg transform hover:scale-110 hover:-translate-y-2 hover:rotate-2 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 cursor-pointer relative z-10`}
                  style={{ 
                    animation: `cardFloat 3s ease-in-out infinite ${index * 0.15}s, cardGlow 4s ease-in-out infinite ${index * 0.2}s`,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-orange-100/20 dark:to-orange-900/20 pointer-events-none"></div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="relative mb-24 z-0">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10 z-0">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="h-full">
              <defs>
                <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1" fill="currentColor"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)"/>
            </svg>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-16">
              <h3 id="choose-template" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Choose Your <span className="text-orange-600 dark:text-orange-400">Style</span>
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Select the perfect estimation approach for your team's workflow
              </p>
            </div>

            {/* Template Selection */}
            <div className="grid lg:grid-cols-3 gap-6 mb-20 relative">
              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500 z-0"></div>
                <button
                  onClick={() => createRoomWithTemplate('sprint-planning')}
                  disabled={isCreating || isJoining}
                  className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-orange-100 dark:border-orange-900 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left h-full flex flex-col z-10"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
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
                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">Fibonacci Scale</span>
                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">Auto Reveal</span>
                  </div>
                </button>
              </div>

              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500 z-0"></div>
                <button
                  onClick={() => createRoomWithTemplate('bug-triage')}
                  disabled={isCreating || isJoining}
                  className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-red-100 dark:border-red-900 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left h-full flex flex-col z-10"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
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
                    <span className="px-3 py-1 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">T-Shirt Sizes</span>
                    <span className="px-3 py-1 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">Anonymous</span>
                  </div>
                </button>
              </div>

              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500 z-0"></div>
                <button
                  onClick={() => createRoomWithTemplate('story-refinement')}
                  disabled={isCreating || isJoining}
                  className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-amber-100 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left h-full flex flex-col z-10"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
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
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">Modified Fibonacci</span>
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">Manual Reveal</span>
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
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-700 z-0"></div>
                  <div className="relative bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-200 dark:border-gray-700 h-full flex flex-col z-10">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6 shadow-lg">
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
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-orange-500 dark:focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
                          disabled={isCreating || isJoining}
                        />
                      </div>
                      
                      <button
                        onClick={createRoom}
                        disabled={isCreating || isJoining}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-bold py-5 rounded-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
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
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
                  <div className="relative bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
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
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-gray-700 font-mono text-center text-2xl tracking-[0.5em] transition-all duration-200"
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
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
                          disabled={isCreating || isJoining}
                        />
                      </div>
                      
                      <button
                        onClick={joinRoom}
                        disabled={isCreating || isJoining || !roomCode}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-bold py-5 rounded-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
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
 
        {/* Why Teams Love It Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gray-900 dark:text-white">Stop the </span>
                <span className="text-transparent bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text">Estimation </span>
                <span className="text-transparent bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text">Chaos</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Transform your agile estimation from chaotic marathons into focused power sessions with Scrint
              </p>
            </div>

            {/* Feature Carousel Replacement - Interactive Cards */}
            <div className="mb-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast Consensus</h3>
                      <p className="text-gray-600 dark:text-gray-300">No more 3-hour meetings. Get aligned in minutes with simultaneous voting that prevents anchoring bias.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">🎭</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Anonymous Mode</h3>
                      <p className="text-gray-600 dark:text-gray-300">Level the playing field. Junior devs get the same voice as seniors when estimates are hidden until reveal.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Analytics</h3>
                      <p className="text-gray-600 dark:text-gray-300">Track velocity trends, spot estimation patterns, and improve your team's predictability over time.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl">🎉</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Celebration Mode</h3>
                      <p className="text-gray-600 dark:text-gray-300">Confetti explosions when consensus is reached. Because estimation wins should feel like wins!</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {/* Enhanced Interactive Demo */}
                  <DemoAreaComponent />
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                onClick={() => {
                  document.getElementById('choose-template')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 rounded-full text-white font-bold text-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer">Start Planning Better
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No signup required • Free forever • Start in 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-orange-200 dark:border-orange-700 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Scrint Logo" 
                className="w-6 h-6 rounded-lg"
              />
              <span className="font-semibold text-gray-900 dark:text-white">Scrint.dev</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/blog"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/analytics"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Analytics
              </Link>
              <Link
                href="/legal"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Legal
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
