import React from 'react';

const PrivacyTermsFooter: React.FC<{ subtle?: boolean; version?: string }> = ({ subtle, version }) => (
  <div
    className="fixed bottom-0 left-0 w-full flex flex-col items-center z-50 pointer-events-none"
    aria-label="Privacy and Terms footer"
    role="contentinfo"
  >
    <a
      href="/legal"
      target="_blank"
      rel="noopener noreferrer"
      className={`pointer-events-auto mb-1 px-2 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors
        ${subtle ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent shadow-none' :
        'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white/80 dark:bg-slate-900/80 shadow'}
      `}
      tabIndex={0}
    >
      Privacy & Terms
    </a>
    {version && (
      <span className="pointer-events-auto mb-3 text-xs text-slate-300 dark:text-slate-600 select-none">v{version}</span>
    )}
  </div>
);

export default PrivacyTermsFooter;
