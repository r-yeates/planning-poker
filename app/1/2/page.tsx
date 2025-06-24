'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, where, query, getDocs } from 'firebase/firestore';
import { db, generateUniqueRoomCode, getRoomByCode, verifyRoomPassword } from '@/lib/firebase';
import { trackRoomCreatedSafe } from '@/lib/analytics-buffer';
import { type ScaleType } from '@/lib/estimation-scales';
import packageJson from '../../../package.json';
import ThemeToggle from '../../components/ThemeToggle';
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
  color: string;
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
    showTooltips: true,
    color: 'from-emerald-400 to-teal-500'
  },
  'bug-triage': {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Quick sizing for bugs and technical debt items',
    icon: '🐛',
    scaleType: 't-shirt',
    autoReveal: false,
    anonymousVoting: true,
    showTooltips: false,
    color: 'from-orange-400 to-red-500'
  },
  'story-refinement': {
    id: 'story-refinement',
    name: 'Story Refinement',
    description: 'Detailed estimation with discussion and consensus building',
    icon: '🔍',
    scaleType: 'fibonacci',
    autoReveal: false,
    anonymousVoting: false,
    showTooltips: true,
    color: 'from-violet-400 to-purple-500'
  }
};

export default function ModernHomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sprint-planning');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated cursor follower */}
      <div 
        className="fixed pointer-events-none z-0 w-96 h-96 rounded-full opacity-5 dark:opacity-10 transition-all duration-300 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />

      {/* Geometric Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 dark:bg-blue-600/20 rounded-full"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple-200/20 dark:bg-purple-600/20 transform rotate-45"></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-emerald-200/20 dark:bg-emerald-600/20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-orange-200/20 dark:bg-orange-600/20 transform rotate-12 rounded-2xl"></div>
        
        {/* Floating triangles */}
        <svg className="absolute top-1/4 left-1/2 w-16 h-16 text-indigo-200/30 dark:text-indigo-400/30 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l10 18H2L12 2z"/>
        </svg>
        <svg className="absolute bottom-1/3 right-1/3 w-12 h-12 text-pink-200/30 dark:text-pink-400/30 animate-pulse delay-1000" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l10 18H2L12 2z"/>
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="Sprintro Logo" 
              className="w-10 h-10 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Sprintro
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/blog" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Blog
            </Link>
            <Link href="/faq" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              FAQ
            </Link>
            <Link href="/analytics" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Analytics
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-20">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Planning poker reimagined
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              Estimate
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
              Smarter
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
            The most intuitive planning poker experience for agile teams. 
            <span className="font-semibold text-slate-700 dark:text-slate-200"> No signups. No downloads. Just results.</span>
          </p>

          {/* Live Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {[
              { label: 'Active Teams', value: '2,847', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Stories Estimated', value: '1.2M+', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Countries', value: '47', color: 'text-purple-600 dark:text-purple-400' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Create Room Card */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create New Room</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Room name (optional)"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Password (optional)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choose Template:</label>
                    <div className="grid gap-3">
                      {Object.values(ROOM_TEMPLATES).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group/template ${
                            selectedTemplate === template.id
                              ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/30'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center text-lg group-hover/template:scale-110 transition-transform duration-300`}>
                              {template.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800 dark:text-white">
                                {template.name}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {template.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCreateRoom()}
                    disabled={isCreating}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {isCreating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Create Room
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Join Room Card */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Join Existing Room</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Room Code
                      </label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center text-lg font-mono tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Password (if required)
                      </label>
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      Quick Join Tips:
                    </div>
                    <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                      <li>• Room codes are 6 characters long</li>
                      <li>• Ask your facilitator for the code</li>
                      <li>• Passwords are case-sensitive</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={!joinCode.trim() || isJoining}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {isJoining ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Joining...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        Join Room
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Templates */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
              Or start with a <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">template</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Pre-configured room settings optimized for different types of estimation sessions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.values(ROOM_TEMPLATES).map((template, index) => (
              <button
                key={template.id}
                onClick={() => handleCreateRoom(template.id)}
                disabled={isCreating}
                className="group relative p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"
                     style={{ background: `linear-gradient(135deg, ${template.color.split(' ')[1]}, ${template.color.split(' ')[3]})` }}
                ></div>
                
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {template.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                      {template.scaleType}
                    </span>
                    {template.autoReveal && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                        auto-reveal
                      </span>
                    )}
                    {template.anonymousVoting && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-full">
                        anonymous
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
              Why choose <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">Sprintro?</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Built with modern teams in mind, focusing on simplicity and effectiveness
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚀', title: 'Instant Setup', desc: 'Create and join rooms in seconds' },
              { icon: '🔒', title: 'Privacy First', desc: 'Anonymous voting and secure sessions' },
              { icon: '📱', title: 'Cross Platform', desc: 'Works on any device, no apps needed' },
              { icon: '⚡', title: 'Real-time Sync', desc: 'Everyone sees updates instantly' },
              { icon: '🎯', title: 'Multiple Scales', desc: 'Fibonacci, T-shirt, and custom scales' },
              { icon: '📊', title: 'Smart Analytics', desc: 'Track team estimation patterns' },
              { icon: '🌙', title: 'Dark Mode', desc: 'Beautiful interface in any lighting' },
              { icon: '🔧', title: 'Customizable', desc: 'Adapt to your team\'s workflow' }
            ].map((feature, index) => (
              <div key={index} className="group p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg transition-all duration-300">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-12 shadow-xl">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-6">
                Ready to transform your 
                <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text"> estimation process?</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
                Join thousands of agile teams who've discovered the joy of effortless planning poker with Sprintro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleCreateRoom('sprint-planning')}
                  disabled={isCreating}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Start Planning Now'}
                </button>
                <Link 
                  href="/blog"
                  className="px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 font-bold rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  Learn Best Practices
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-700 mt-20 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Sprintro Logo" 
                  className="w-8 h-8 rounded-xl"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Sprintro
                </span>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                The modern planning poker experience that makes agile estimation effortless for distributed teams.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                v{packageJson.version} • Made with ❤️ for agile teams
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Product</h4>
              <div className="space-y-2">
                <Link href="/blog" className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link>
                <Link href="/faq" className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</Link>
                <Link href="/analytics" className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Analytics</Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Features</h4>
              <div className="space-y-2 text-sm">
                <div className="text-slate-600 dark:text-slate-400">Real-time Collaboration</div>
                <div className="text-slate-600 dark:text-slate-400">Multiple Estimation Scales</div>
                <div className="text-slate-600 dark:text-slate-400">Anonymous Voting</div>
                <div className="text-slate-600 dark:text-slate-400">Room Templates</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Legal</h4>
              <div className="space-y-2">
                <Link href="/legal" className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
                <Link href="/legal" className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 mt-12 pt-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              © 2025 Sprintro. Empowering agile teams worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
