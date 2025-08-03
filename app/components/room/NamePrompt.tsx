'use client';

import { useState, useEffect } from 'react';

interface NamePromptProps {
  onSubmit: (name: string, password?: string) => void;
  requiresPassword?: boolean;
  passwordError?: string;
  isLoading?: boolean;
}

export default function NamePrompt({ onSubmit, requiresPassword, passwordError, isLoading }: NamePromptProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Clear local error when password error from parent changes
  useEffect(() => {
    if (passwordError) {
      setError('');
    }
  }, [passwordError]);  // Initialize name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setName(savedName);
    }
  }, []);  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (requiresPassword && !password.trim()) {
      setError('Please enter the room password');
      return;
    }
    
    setError(''); // Clear local errors
    
    // Store name in localStorage for future use
    localStorage.setItem('userName', name.trim());
    onSubmit(name.trim(), password.trim() || undefined);
  };  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#212121] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {requiresPassword ? 'Enter Name & Password' : 'Enter Your Name'}
        </h2>
        <p className="text-gray-600 dark:text-[#aaaaaa] mb-4">
          {requiresPassword 
            ? 'This room is password-protected. Please enter your name and the room password.'
            : 'Please enter your name to join the planning poker session.'
          }
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || passwordError) && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error || passwordError}</div>
          )}
          
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#404040] bg-white dark:bg-[#181818] text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            disabled={isLoading}
            autoFocus
          />          {requiresPassword && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-[#aaaaaa] mb-1">
                Password (required)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#404040] bg-white dark:bg-[#181818] text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                disabled={isLoading}
              />
            </div>
          )}<button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            disabled={isLoading || !name.trim() || (requiresPassword && !password.trim())}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
