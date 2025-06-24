'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db, generateUniqueRoomCode, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackRoomCreatedSafe } from '@/lib/analytics-buffer';
import { type ScaleType } from '@/lib/estimation-scales';
import packageJson from '../../package.json';
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
    description: 'Perfect for estimating user stories and sprint backlog items',
    icon: '🚀',
    scaleType: 'fibonacci',
    autoReveal: true,
    anonymousVoting: false,
    showTooltips: true
  },
  'bug-triage': {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Quick sizing for bugs and technical debt items',
    icon: '🔧',
    scaleType: 't-shirt',
    autoReveal: false,
    anonymousVoting: true,
    showTooltips: false
  },
  'story-refinement': {
    id: 'story-refinement',
    name: 'Story Refinement',
    description: 'Detailed estimation with discussion and consensus building',
    icon: '🎯',
    scaleType: 'fibonacci',
    autoReveal: false,
    anonymousVoting: false,
    showTooltips: true
  }
};

export default function WarmHomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sprint-planning');
  const [activeSection, setActiveSection] = useState<'create' | 'join'>('create');

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

  return (
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
            <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Planning
            </span>
            <span className="block text-gray-900 dark:text-white transform -skew-x-3">
              Poker
            </span>
            <span className="block bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent text-5xl md:text-6xl">
              Reimagined
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            The most intuitive estimation tool for modern teams. Fast, secure, and beautifully designed.
          </p>

          
        </div>

        {/* Main Action Area */}
        <div className="max-w-5xl mx-auto mb-20">
          {/* Section Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-2 border border-orange-200 dark:border-orange-700">
              <button
                onClick={() => setActiveSection('create')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeSection === 'create'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setActiveSection('join')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeSection === 'join'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Create Room Section */}
          {activeSection === 'create' && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-10 border border-orange-200 dark:border-orange-700 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Create Your Room
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Set up a new estimation session in seconds
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Room Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Room Name
                    </label>
                    <input
                      type="text"
                      placeholder="Sprint Planning Session"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-4 bg-white/60 dark:bg-gray-700/60 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Secure your room"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-4 bg-white/60 dark:bg-gray-700/60 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Choose Template
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.values(ROOM_TEMPLATES).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                          selectedTemplate === template.id
                            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 shadow-lg transform scale-105'
                            : 'border-orange-200 dark:border-orange-600 bg-white/40 dark:bg-gray-700/40 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        }`}
                      >
                        <div className="text-4xl mb-3">{template.icon}</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {template.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={() => handleCreateRoom()}
                  disabled={isCreating}
                  className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Room...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Create Room
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Join Room Section */}
          {activeSection === 'join' && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-10 border border-orange-200 dark:border-orange-700 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Join Existing Room
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Enter the room code to join your team
                </p>
              </div>

              <div className="max-w-lg mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-6 py-4 bg-white/60 dark:bg-gray-700/60 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors text-center font-mono text-2xl tracking-widest text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password (if required)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white/60 dark:bg-gray-700/60 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={!joinCode.trim() || isJoining}
                  className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Join Room
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: '🔥',
              title: 'Blazing Fast',
              description: 'Start estimating in seconds. No lengthy setup or complicated configurations.',
              gradient: 'from-red-500 to-pink-500'
            },
            {
              icon: '🛡️',
              title: 'Fort Knox Security',
              description: 'End-to-end encryption, optional passwords, and automatic data cleanup.',
              gradient: 'from-orange-500 to-red-500'
            },
            {
              icon: '📱',
              title: 'Universal Access',
              description: 'Perfect experience on any device. Mobile, tablet, desktop - it just works.',
              gradient: 'from-amber-500 to-orange-500'
            }
          ].map((feature, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-orange-200 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-3xl mb-6 transform group-hover:rotate-6 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-12 text-white text-center mb-20">
          <h2 className="text-4xl font-bold mb-8">Trusted by Teams Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-black mb-2">10K+</div>
              <div className="text-orange-100">Active Teams</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">500K+</div>
              <div className="text-orange-100">Stories Estimated</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">99.9%</div>
              <div className="text-orange-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">50+</div>
              <div className="text-orange-100">Countries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-orange-200 dark:border-orange-700">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🎲</span>
                </div>
                <span className="text-2xl font-bold text-white">Scrint</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Making planning poker effortless for agile teams worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <Link href="/blog" className="block text-gray-400 hover:text-orange-400 transition-colors">Blog</Link>
                <Link href="/faq" className="block text-gray-400 hover:text-orange-400 transition-colors">FAQ</Link>
                <Link href="/analytics" className="block text-gray-400 hover:text-orange-400 transition-colors">Analytics</Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/legal" className="block text-gray-400 hover:text-orange-400 transition-colors">Terms</Link>
                <Link href="/legal" className="block text-gray-400 hover:text-orange-400 transition-colors">Privacy</Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Twitter</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">GitHub</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Discord</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Scrint. All rights reserved. v{packageJson.version}
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with</span>
              <span className="text-red-500">❤️</span>
              <span className="text-gray-400 text-sm">for agile teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
