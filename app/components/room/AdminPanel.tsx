'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ESTIMATION_SCALES, ScaleType } from '@/lib/estimation-scales';
import type { Room } from '@/lib/firebase';

interface AdminPanelProps {
  room: Room;
  roomId: string;
  isAdmin: boolean;
  onCardSelect: (value: number | string | null) => void;
}

export default function AdminPanel({
  room,
  roomId,
  isAdmin,
  onCardSelect
}: AdminPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

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
    updateRoomSetting('autoReveal', !room.autoReveal);
  };

  const toggleAnonymousVoting = () => {
    updateRoomSetting('anonymousVoting', !room.anonymousVoting);
  };

  const toggleTooltips = () => {
    updateRoomSetting('showTooltips', !room.showTooltips);
  };

  const toggleConfetti = () => {
    updateRoomSetting('confettiEnabled', !room.confettiEnabled);
  };

  const changeScale = (newScale: ScaleType) => {
    if (!room.votesRevealed) return; // Prevent scale change during voting
    
    updateRoomSetting('scaleType', newScale, {
      votes: {},
      votesRevealed: false
    });
    
    // Reset card selection
    onCardSelect(null);
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Header with toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">        
          <div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Room Settings</h3>
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          {/* Scale Management */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estimation Scale
            </label>
            <select 
              value={room.scaleType || 'fibonacci'} 
              onChange={(e) => changeScale(e.target.value as ScaleType)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={!room.votesRevealed}
            >
              {Object.values(ESTIMATION_SCALES).map((scale) => (
                <option key={scale.type} value={scale.type}>
                  {scale.name}
                </option>
              ))}
            </select>
            {!room.votesRevealed && (
              <p className="text-xs text-gray-500">
                Scale can be changed after votes are revealed
              </p>
            )}
          </div>

          {/* Auto-Reveal Setting */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-reveal votes</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Auto-show when everyone votes</div>
            </div>
            <button
              onClick={toggleAutoReveal}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                room.autoReveal ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
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
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Anonymous voting</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Hide names during voting</div>
            </div>
            <button
              onClick={toggleAnonymousVoting}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                room.anonymousVoting ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
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
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Card tooltips</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Show card descriptions</div>
            </div>
            <button
              onClick={toggleTooltips}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                room.showTooltips ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
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
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Confetti celebrations</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Show confetti on reveal</div>
            </div>
            <button
              onClick={toggleConfetti}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                room.confettiEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
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
        </div>
      )}
    </div>
  );
}
