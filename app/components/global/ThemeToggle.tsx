'use client';

import { useTheme } from './ThemeProvider';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by not rendering until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-white dark:bg-[#212121] border border-slate-200 dark:border-[#303030]">
        {/* Placeholder to prevent layout shift */}
      </div>
    );
  }

  const getButtonTitle = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to system theme';
    return 'Switch to light mode';
  };

  const getButtonLabel = () => {
    if (theme === 'system') {
      return `System theme (currently ${resolvedTheme})`;
    }
    return `${theme} theme`;
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-white dark:bg-[#212121] border border-slate-200 dark:border-[#303030] text-slate-600 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors flex items-center justify-center relative"
      title={getButtonTitle()}
      aria-label={getButtonLabel()}
    >
      {theme === 'system' ? (
        // Monitor icon for system theme
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {/* Small indicator showing current resolved theme */}
          <div 
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-[#212121] ${
              resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-yellow-400'
            }`}
            title={`Currently ${resolvedTheme}`}
          />
        </div>
      ) : resolvedTheme === 'light' ? (
        // Sun icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
