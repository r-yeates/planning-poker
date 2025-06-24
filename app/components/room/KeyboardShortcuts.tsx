'use client';

import { useEffect, useState } from 'react';

interface KeyboardShortcutsProps {
  isAdmin: boolean;
  isSpectator: boolean;
  onQuickVote: (value: number | string) => void;
  onRevealVotes: () => void;
  onNewRound: () => void;
  onToggleSpectator: () => void;
  availableValues: (number | string)[];
}

export default function KeyboardShortcuts({
  isAdmin,
  isSpectator,
  onQuickVote,
  onRevealVotes,
  onNewRound,
  onToggleSpectator,
  availableValues
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Convert key to uppercase for consistency
      const key = e.key.toUpperCase();

      switch (key) {
        case 'H':
          e.preventDefault();
          setShowHelp(!showHelp);
          break;

        case 'R':
          if (isAdmin) {
            e.preventDefault();
            onRevealVotes();
          }
          break;

        case 'N':
          if (isAdmin) {
            e.preventDefault();
            onNewRound();
          }
          break;

        case 'S':
          e.preventDefault();
          onToggleSpectator();
          break;

        case 'ESCAPE':
          e.preventDefault();
          setShowHelp(false);
          break;

        default:
          // Handle number keys for voting (1-9, 0)
          if (!isSpectator && /^[0-9]$/.test(key)) {
            const index = key === '0' ? 9 : parseInt(key) - 1; // 0 maps to index 9
            if (index < availableValues.length) {
              e.preventDefault();
              onQuickVote(availableValues[index]);
            }
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showHelp, isAdmin, isSpectator, onQuickVote, onRevealVotes, onNewRound, onToggleSpectator, availableValues]);

  // Don't render anything if help is not shown
  if (!showHelp) return null;

  return (
    <>
      {/* Overlay Background */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={() => setShowHelp(false)}
      >
        {/* Help Panel */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h3>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-3">
            {/* Voting Shortcuts */}
            {!isSpectator && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                  Voting
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {availableValues.slice(0, 10).map((value, index) => {
                    const keyLabel = index === 9 ? '0' : (index + 1).toString();
                    return (
                      <div key={value} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Vote <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">{value}</span>
                        </span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                          {keyLabel}
                        </kbd>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Shortcuts */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                General
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Toggle spectator mode</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                    S
                  </kbd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Show/hide this help</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                    H
                  </kbd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Close dialogs</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>

            {/* Admin Shortcuts */}
            {isAdmin && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                  Admin Only
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Reveal votes</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      R
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Start new round</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      N
                    </kbd>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">H</kbd> anytime to toggle this help
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
