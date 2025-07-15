'use client';


import { useState, useEffect } from 'react';
import { getGlobalAnalytics, getDailyAnalytics, initializeAnalytics } from '@/lib/firebase';
import type { GlobalAnalytics, DailyAnalytics } from '@/lib/firebase';
import ThemeToggle from '../components/global/ThemeToggle';
import Link from 'next/link';

// Note: Since this is a client component, metadata should be handled by layout
// This export won't work in a client component, but I'll add it for reference

export default function AnalyticsPage() {
  const [globalStats, setGlobalStats] = useState<GlobalAnalytics | null>(null);
  const [todayStats, setTodayStats] = useState<DailyAnalytics | null>(null);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        
        // Initialize analytics if needed
        await initializeAnalytics();
        
        // Load global analytics
        const global = await getGlobalAnalytics();
        setGlobalStats(global);
        
        // Load today's analytics
        const today = new Date().toISOString().split('T')[0];
        const daily = await getDailyAnalytics(today);
        setTodayStats(daily);
        
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Loading Analytics...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📊 Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Planning Poker usage statistics</p>
          </div>
          <div className="flex items-center gap-4">
            
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Global Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">📈 All-Time Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Rooms Created"
              value={globalStats?.totalRoomsCreated || 0}
              icon="🏠"
              color="blue"
            />
            <StatCard
              title="Active Rooms"
              value={globalStats?.totalRoomsActive || 0}
              icon="🟢"
              color="green"
            />
            <StatCard
              title="Total Participants"
              value={globalStats?.totalParticipants || 0}
              icon="👥"
              color="purple"
            />
            <StatCard
              title="Votes Cast"
              value={globalStats?.totalVotesCast || 0}
              icon="🗳️"
              color="orange"
            />
            <StatCard
              title="Voting Rounds"
              value={globalStats?.totalVotingRounds || 0}
              icon="🔄"
              color="indigo"
            />
            <StatCard
              title="Avg. Room Size"
              value={globalStats ? (globalStats.totalParticipants / Math.max(globalStats.totalRoomsCreated, 1)).toFixed(1) : '0'}
              icon="📊"
              color="pink"
            />
          </div>
        </div>

        {/* Today's Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">📅 Today&apos;s Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Rooms Created"
              value={todayStats?.roomsCreated || 0}
              icon="🆕"
              color="blue"
            />
            <StatCard
              title="New Participants"
              value={todayStats?.participantsJoined || 0}
              icon="👋"
              color="green"
            />
            <StatCard
              title="Votes Cast"
              value={todayStats?.votesCast || 0}
              icon="✋"
              color="orange"
            />
            <StatCard
              title="Rounds Completed"
              value={todayStats?.votingRounds || 0}
              icon="✅"
              color="purple"
            />
          </div>
        </div>

        {/* Last Updated */}
        {globalStats?.lastUpdated && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date(globalStats.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'pink';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`bg-gradient-to-r ${colorClasses[color]} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="text-2xl">{icon}</div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      </div>
    </div>
  );
}
