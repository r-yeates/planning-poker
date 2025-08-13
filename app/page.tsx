'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db, generateUniqueRoomCode, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackRoomCreatedSafe } from '@/lib/analytics-buffer';
import { type ScaleType } from '@/lib/estimation-scales';
import ThemeToggle from './components/global/ThemeToggle';
import Link from 'next/link';
import CustomTextTransition from './components/global/CustomTextTransition';
import PlanningPokerDemo from './components/home/PlanningPokerDemo';
import Image from 'next/image';

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

export default function HomePage() {
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState(''); // For creating room with password
  const [joinPassword, setJoinPassword] = useState(''); // For joining password-protected room
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Text transition states (only for hero)
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  
  // Memoize static data to prevent unnecessary re-creation
  const ROOM_TEMPLATES = useMemo<Record<string, RoomTemplate>>(() => ({
    'sprint-planning': {
      id: 'sprint-planning',
      name: 'Sprint Planning',
      description: 'Ideal for story estimation with automatic reveal when all votes are cast',
      icon: '🏃',
      scaleType: 'fibonacci',
      autoReveal: true,
      anonymousVoting: false,
      showTooltips: true
    },
    'bug-triage': {
      id: 'bug-triage',
      name: 'Bug Triage',
      description: 'Fast-track sizing for defects and technical debt with anonymous voting',
      icon: '🐛',
      scaleType: 't-shirt',
      autoReveal: false,
      anonymousVoting: true,
      showTooltips: false
    },
    'story-refinement': {
      id: 'story-refinement',
      name: 'Story Refinement',
      description: 'Detailed estimation sessions with manual reveal for thorough discussion',
      icon: '📝',
      scaleType: 'modified-fibonacci',
      autoReveal: false,
      anonymousVoting: false,
      showTooltips: true
    }
  }), []);

  const heroTexts = useMemo(() => [
    'Real-time collaborative estimation for agile teams.',
    'Eliminate estimation bias with anonymous voting.',
    'Cut planning meetings from hours to minutes.',
    'Get better velocity predictions with data insights.',
    'Boost team collaboration with real-time feedback.'
  ], []);

  // Text transition effect (only for hero)
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTextIndex((current) => (current + 1) % heroTexts.length);
    }, 3500); // Change every 3.5 seconds
    return () => clearInterval(interval);
  }, [heroTexts.length]);

  // Set loading to false immediately since we don't have actual async loading
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Initialize particle system
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          delay: Math.random() * 8
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Mouse tracking for particle interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Navigation scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        // Always show nav at top
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 200) {
        // Hide when scrolling down
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Show when scrolling up
        setIsNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Memoize callback functions for better performance
  const ensureUserId = useCallback(() => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = Math.random().toString(36).substring(2);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }, []);

  const createRoom = async () => {
    setError('');
    setIsCreating(true);
    try {
      ensureUserId();

      const roomCode = await generateUniqueRoomCode();
      const roomData: Record<string, unknown> = {
        roomCode,
        participants: {}, // Start with empty participants - user will be added when they enter their name
        votes: {},
        votesRevealed: false,
        autoReveal: false, // Default to auto-reveal disabled
        anonymousVoting: false, // Default to non-anonymous voting
        showTooltips: false, // Default to tooltips disabled
        confettiEnabled: false, // Always set confetti to false on room creation
        currentTicket: '',
        ticketQueue: [], // Start with empty ticket queue
        scaleType: 'fibonacci', // Default to fibonacci, admins can change it later
        createdAt: new Date(),
        timer: {
          startTime: null,
          duration: 0,
          isRunning: false
        },
        roundHistory: [],
        isTicketQueueCollapsed: true, // Always collapse ticket queue on room creation
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
      ensureUserId();

      const roomCode = await generateUniqueRoomCode();
      const roomData: Record<string, unknown> = {
        roomCode,
        participants: {}, // Start with empty participants - user will be added when they enter their name
        votes: {},
        votesRevealed: false,
        autoReveal: template.autoReveal,
        anonymousVoting: template.anonymousVoting,
        showTooltips: template.showTooltips,
        confettiEnabled: false, // Always set confetti to false on room creation
        currentTicket: '',
        ticketQueue: [], // Start with empty ticket queue
        scaleType: template.scaleType,
        createdAt: new Date(),
        timer: {
          startTime: null,
          duration: 0,
          isRunning: false
        },
        roundHistory: [],
        isTicketQueueCollapsed: true, // Always collapse ticket queue on room creation
      };
      
      // Add password if provided (templates don't include passwords by default)
      if (roomPassword.trim()) {
        roomData.password = roomPassword.trim();
      }
      
      await addDoc(collection(db, 'rooms'), roomData);

      // Track analytics
      await trackRoomCreatedSafe();

      // Set verification flag for auto-join and mark as room creator
      sessionStorage.setItem('roomJoinVerified', roomCode);
      sessionStorage.setItem('roomCreator', roomCode); // Mark this user as the creator

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
      ensureUserId();
      
      // Set verification flag for auto-join
      sessionStorage.setItem('roomJoinVerified', normalizedCode);
      
      router.push(`/room/${normalizedCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  // Memoize structured data for SEO
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Sprintro",
    "description": "Free online planning poker tool for agile teams. Estimate user stories, eliminate bias, and reach consensus faster.",
    "url": "https://sprintro.dev",
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
      "name": "Sprintro",
      "url": "https://sprintro.dev"
    }
  }), []);

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      {/* Navigation Skeleton */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-7xl w-full mx-auto px-6">
        <div className="bg-white/70 dark:bg-[#212121]/70 backdrop-blur-xl border border-slate-300/80 dark:border-[#303030]/50 rounded-2xl px-8 py-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 skeleton rounded-lg"></div>
              <div className="w-24 h-6 skeleton rounded"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-8 skeleton rounded-lg"></div>
              <div className="w-12 h-8 skeleton rounded-lg"></div>
              <div className="w-16 h-8 skeleton rounded-lg"></div>
              <div className="w-8 h-8 skeleton rounded-lg ml-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100/30 dark:from-[#0f0f0f] dark:via-[#181818] dark:to-[#212121] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[65vh]">
            {/* Left Column Skeleton */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-6">
                <div className="w-96 h-16 skeleton rounded-xl mx-auto lg:mx-0"></div>
                <div className="w-80 h-6 skeleton rounded mx-auto lg:mx-0"></div>
              </div>
              <div className="w-72 h-6 skeleton rounded mx-auto lg:mx-0"></div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <div className="w-48 h-14 skeleton rounded-xl"></div>
                <div className="w-40 h-14 skeleton rounded-xl"></div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="relative">
              <div className="bg-white/60 dark:bg-[#212121]/80 backdrop-blur-sm border border-slate-200/50 dark:border-[#303030] rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="w-full h-8 skeleton rounded"></div>
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="aspect-square skeleton rounded-lg"></div>
                    ))}
                  </div>
                  <div className="w-full h-12 skeleton rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section Skeleton */}
      <section className="py-24 bg-white dark:bg-[#181818]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="w-64 h-12 skeleton rounded mx-auto mb-4"></div>
            <div className="w-96 h-6 skeleton rounded mx-auto"></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#212121] p-8 rounded-2xl border border-slate-200 dark:border-[#303030] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 skeleton rounded-xl"></div>
                  <div className="w-32 h-6 skeleton rounded"></div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="w-full h-4 skeleton rounded"></div>
                  <div className="w-3/4 h-4 skeleton rounded"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="w-24 h-6 skeleton rounded-full"></div>
                  <div className="w-20 h-6 skeleton rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <>
      {/* Show skeleton loading initially */}
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Structured Data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
      
      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulseSubtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulseSubtle 3s ease-in-out infinite;
        }
        
        /* Skeleton Loading Styles */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
        
        .dark .skeleton {
          background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
          background-size: 200% 100%;
        }
        
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* Particle System Styles */
        .particle {
          position: absolute;
          pointer-events: none;
          opacity: 0.6;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.4) 100%);
          border-radius: 50%;
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        }
        
        .dark .particle {
          background: radial-gradient(circle, rgba(96, 165, 250, 0.6) 0%, rgba(167, 139, 250, 0.3) 100%);
        }
        
        @keyframes particleFloat {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-20px) translateX(10px) scale(1.1);
            opacity: 0.8;
          }
        }
        
        .particle-animated {
          animation: particleFloat 8s ease-in-out infinite;
        }
      `}</style>
      
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
        {/* Floating Navigation Bar */}
        <nav className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-7xl w-full mx-auto px-3 md:px-6 transition-all duration-300 ${
          isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <div className="bg-white/70 dark:bg-[#212121]/70 backdrop-blur-xl border border-slate-300/80 dark:border-[#303030]/50 rounded-2xl px-4 md:px-8 py-3 md:py-4 shadow-2xl shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                {/* Logo for nav bar */}
                <span className="relative w-8 h-8 md:w-10 md:h-10">
                  <Image src="/logo-dark.png" alt="Sprintro Logo" width={40} height={40} className="rounded-lg shadow-sm block dark:hidden" />
                  <Image src="/logo.png" alt="Sprintro Logo" width={40} height={40} className="rounded-lg shadow-sm hidden dark:block" />
                </span>
                <span className="font-semibold text-lg md:text-xl text-slate-900 dark:text-white">Sprintro</span>
              </div>
              
              <div className="flex items-center gap-1 md:gap-2">
                <Link
                  href="/blog"
                  className="hidden sm:block px-3 md:px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-[#303030] rounded-lg transition-all duration-200"
                >
                  Blog
                </Link>
                <Link
                  href="/faq"
                  className="hidden sm:block px-3 md:px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-[#303030] rounded-lg transition-all duration-200"
                >
                  FAQ
                </Link>
                <Link
                  href="/analytics"
                  className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-[#303030] rounded-lg transition-all duration-200"
                >
                  Analytics
                </Link>
                <div className="ml-1 md:ml-3">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100/30 dark:from-[#0f0f0f] dark:via-[#181818] dark:to-[#212121] overflow-hidden pt-24 md:pt-6">
          {/* Particle System */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="particle particle-animated"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDelay: `${particle.delay}s`,
                  transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`
                }}
              />
            ))}
          </div>

          <div className="absolute inset-0 z-1">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#22272b_1px,transparent_1px),linear-gradient(to_bottom,#22272b_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#303030_1px,transparent_1px),linear-gradient(to_bottom,#303030_1px,transparent_1px)] bg-[size:4rem_4rem] bg-[position:1.5rem_0] [mask-image:radial-gradient(ellipse_80%_60%_at_30%_40%,#000_50%,transparent_80%)] opacity-40 animate-pulse"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[65vh]">
              {/* Left Column - Title and Buttons */}
              <div className="space-y-8 text-center lg:text-left relative z-20 animate-fade-in-up">
                <div className="space-y-6 animate-slide-in-left">
                  <h1 className="text-4xl lg:text-6xl xl:text-7xl font-black text-slate-900 dark:text-[#f1f1f1] leading-tight tracking-tight">
                    Agile Estimation
                    <br />
                    <span className="bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent dark:from-[#60a5fa] dark:via-[#a78bfa] dark:to-[#22d3ee] animate-gradient">
                      Made Simple
                    </span>
                  </h1>
                  
                  <p className="text-xl lg:text-2xl text-slate-600 dark:text-[#aaaaaa] font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in" style={{animationDelay: '0.2s'}}>
                    Skip the endless debates. Get accurate story points in minutes, not hours.
                  </p>
                </div>
                
                <div className="text-lg lg:text-xl text-slate-600 dark:text-[#aaaaaa] h-12 flex items-center justify-center lg:justify-start animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <CustomTextTransition className="font-medium">
                    {heroTexts[heroTextIndex]}
                  </CustomTextTransition>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                  <button
                    onClick={() => createRoomWithTemplate('sprint-planning')}
                    disabled={isCreating || isJoining}
                    className="inline-flex items-center gap-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-subtle"
                  >
                    Start Planning Session
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('templates')?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }}
                    className="inline-flex items-center gap-3 bg-transparent hover:bg-[#272727] text-slate-900 dark:text-[#f1f1f1] px-8 py-4 rounded-xl font-semibold text-lg border-2 border-slate-300 dark:border-[#404040] hover:border-[#3b82f6] dark:hover:border-[#60a5fa] shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Explore Templates
                  </button>
                </div>
              </div>

              {/* Right Column - Demo Cards */}
              <div className="relative z-30 animate-fade-in-right">
                <div className="bg-white/60 dark:bg-[#212121]/80 backdrop-blur-sm border border-slate-200/50 dark:border-[#303030] rounded-3xl p-8 shadow-2xl relative">
                  <PlanningPokerDemo />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="py-24 bg-white dark:bg-[#181818]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Choose Your Method
              </h2>
              <p className="text-xl text-slate-600 dark:text-[#aaaaaa] max-w-3xl mx-auto">
                Select from professionally configured templates or customize your own estimation approach
              </p>
            </div>

            {/* Template Cards */}
            <div className="grid lg:grid-cols-3 gap-8 mb-20">
              {[
                {
                  id: 'sprint-planning',
                  name: 'Sprint Planning',
                  description: 'Ideal for story estimation with automatic reveal when all votes are cast',
                  color: 'from-emerald-500 to-teal-600',
                  bgColor: 'emerald-50',
                  borderColor: 'emerald-200',
                  textColor: 'emerald-700',
                  darkBgColor: 'emerald-950/50',
                  darkBorderColor: 'emerald-800',
                  darkTextColor: 'emerald-300'
                },
                {
                  id: 'bug-triage',
                  name: 'Bug Triage',
                  description: 'Fast-track sizing for defects and technical debt with anonymous voting',
                  color: 'from-amber-500 to-orange-600',
                  bgColor: 'amber-50',
                  borderColor: 'amber-200',
                  textColor: 'amber-700',
                  darkBgColor: 'amber-950/50',
                  darkBorderColor: 'amber-800',
                  darkTextColor: 'amber-300'
                },
                {
                  id: 'story-refinement',
                  name: 'Story Refinement',
                  description: 'Detailed estimation sessions with manual reveal for thorough discussion',
                  color: 'from-[#3b82f6] to-[#8b5cf6]',
                  bgColor: 'slate-50',
                  borderColor: 'slate-200',
                  textColor: 'slate-700',
                  darkBgColor: '[#272727]',
                  darkBorderColor: '[#404040]',
                  darkTextColor: '[#f1f1f1]'
                }
              ].map((template, index) => (
                <div key={template.id} className="group relative">
                  <button
                    onClick={() => createRoomWithTemplate(template.id)}
                    disabled={isCreating || isJoining}
                    className="relative w-full bg-white dark:bg-[#212121] p-8 rounded-2xl border border-slate-200 dark:border-[#303030] hover:border-slate-300 dark:hover:border-[#404040] hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center shadow-md`}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-slate-600 dark:text-[#aaaaaa] mb-6 leading-relaxed">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 bg-${template.bgColor} dark:bg-${template.darkBgColor} text-${template.textColor} dark:text-${template.darkTextColor} border border-${template.borderColor} dark:border-${template.darkBorderColor} rounded-full text-sm font-medium`}>
                        {ROOM_TEMPLATES[template.id]?.scaleType === 'fibonacci' ? 'Fibonacci Scale' : 
                         ROOM_TEMPLATES[template.id]?.scaleType === 't-shirt' ? 'T-Shirt Sizes' : 
                         'Modified Fibonacci'}
                      </span>
                      {ROOM_TEMPLATES[template.id]?.autoReveal && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-[#303030] text-slate-700 dark:text-[#cccccc] border border-slate-200 dark:border-[#404040] rounded-full text-sm font-medium">
                          Auto Reveal
                        </span>
                      )}
                      {ROOM_TEMPLATES[template.id]?.anonymousVoting && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-[#303030] text-slate-700 dark:text-[#cccccc] border border-slate-200 dark:border-[#404040] rounded-full text-sm font-medium">
                          Anonymous
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Room Section */}
            <div className="bg-slate-50 dark:bg-[#212121] rounded-3xl p-8 lg:p-12 border border-slate-200 dark:border-[#303030]">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Custom Configuration
                </h3>
                <p className="text-lg text-slate-600 dark:text-[#aaaaaa]">
                  Create a personalized room or join an existing estimation session
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Create Room */}
                <div className="bg-white dark:bg-[#181818] p-8 rounded-2xl border border-slate-200 dark:border-[#303030] shadow-sm">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Create New Room</h4>
                    <p className="text-slate-600 dark:text-[#aaaaaa] text-sm mt-1">Host your own estimation session</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-[#cccccc] mb-2">
                        Room Password
                      </label>
                      <input
                        type="password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="Optional security password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#212121] text-slate-900 dark:text-white focus:border-[#3b82f6] dark:focus:border-[#60a5fa] focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
                        disabled={isCreating || isJoining}
                      />
                    </div>
                    
                    <button
                      onClick={createRoom}
                      disabled={isCreating || isJoining}
                      className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {isCreating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating Room...
                        </span>
                      ) : 'Create Room'}
                    </button>
                  </div>
                </div>

                {/* Join Room */}
                <div className="bg-white dark:bg-[#181818] p-8 rounded-2xl border border-slate-200 dark:border-[#303030] shadow-sm">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Join Existing Room</h4>
                    <p className="text-slate-600 dark:text-[#aaaaaa] text-sm mt-1">Enter an active estimation session</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-[#cccccc] mb-2">
                        Room Code
                      </label>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="Enter 5-character code"
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#212121] text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 font-mono text-center text-xl tracking-wider transition-all outline-none"
                        disabled={isCreating || isJoining}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-[#cccccc] mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        placeholder="Enter if room is protected"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#212121] text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-all outline-none"
                        disabled={isCreating || isJoining}
                      />
                    </div>
                    
                    <button
                      onClick={joinRoom}
                      disabled={isCreating || isJoining || !roomCode}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {isJoining ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Joining Room...
                        </span>
                      ) : 'Join Room'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-center">
                  <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 dark:bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Enterprise-Grade Features
              </h2>
              <p className="text-xl text-slate-600 dark:text-[#aaaaaa] max-w-3xl mx-auto">
                Built for professional teams who demand reliability, accuracy, and seamless collaboration
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    title: 'Rapid Consensus Building',
                    description: 'Eliminate lengthy discussions with simultaneous voting that prevents cognitive bias and anchoring effects.',
                    color: 'from-[#3b82f6] to-[#8b5cf6]'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.25-4.5a2.44 2.44 0 00-1.07-.06H12m8.25 4.5a2.44 2.44 0 00-1.07-.06" />
                      </svg>
                    ),
                    title: 'Anonymous Estimation',
                    description: 'Ensure equal participation across all seniority levels with optional anonymous voting modes.',
                    color: 'from-emerald-500 to-teal-600'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    title: 'Advanced Analytics',
                    description: 'Track team velocity patterns and estimation accuracy to continuously improve planning precision.',
                    color: 'from-amber-500 to-orange-600'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    title: 'Team Collaboration',
                    description: 'Real-time updates and engagement features that keep distributed teams connected and focused.',
                    color: 'from-purple-500 to-pink-600'
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-md`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-[#aaaaaa] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="bg-white dark:bg-[#212121] rounded-2xl p-8 border border-slate-200 dark:border-[#303030] shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="ml-auto text-sm text-slate-500 dark:text-[#888888] font-mono">sprintro.dev</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center text-white font-bold text-sm">SC</div>
                      <span className="text-sm font-medium text-slate-700 dark:text-[#cccccc]">Team estimation in progress...</span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {['1', '2', '3', '5', '8'].map((value) => (
                        <div 
                          key={value}
                          className="aspect-square bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        >
                          {value}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Consensus achieved: 5 story points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-24 bg-white dark:bg-[#181818]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Knowledge Center
              </h2>
              <p className="text-xl text-slate-600 dark:text-[#aaaaaa] max-w-3xl mx-auto">
                Expert guidance and best practices for successful agile estimation
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#272727] dark:to-[#303030] rounded-2xl p-8 border border-slate-200 dark:border-[#404040]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Expert Articles</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-[#cccccc]">Planning Poker Fundamentals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#8b5cf6] rounded-full"></div>
                    <span className="text-slate-700 dark:text-[#cccccc]">Avoiding Estimation Bias</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-[#cccccc]">Remote Team Best Practices</span>
                  </div>
                </div>
                <Link 
                  href="/blog"
                  className="inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  Read Articles
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Frequently Asked</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-[#cccccc]">Understanding Story Points</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-[#cccccc]">Handling Estimation Conflicts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-[#cccccc]">Scaling Agile Estimation</span>
                  </div>
                </div>
                <Link 
                  href="/faq"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  View FAQ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 dark:bg-[#0f0f0f] border-t border-slate-200 dark:border-[#303030]">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                {/* Logo for footer */}
                <span className="relative w-8 h-8">
                  <Image src="/logo-dark.png" alt="Sprintro Logo" className="w-8 h-8 rounded-lg block dark:hidden" width={32} height={32} />
                  <Image src="/logo.png" alt="Sprintro Logo" className="w-8 h-8 rounded-lg hidden dark:block" width={32} height={32} />
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">Sprintro</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <Link href="/blog" className="text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white transition-colors">
                  Blog
                </Link>
                <Link href="/faq" className="text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white transition-colors">
                  FAQ
                </Link>
                <Link href="/analytics" className="text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white transition-colors">
                  Analytics
                </Link>
                <Link href="/legal" className="text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white transition-colors">
                  Legal
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
        </>
      )}
    </>
  );
}