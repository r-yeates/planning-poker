'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareRoomModalProps {
  roomCode: string;
  onClose: () => void;
}

export default function ShareRoomModal({ roomCode, onClose }: ShareRoomModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/room/${roomCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#212121] rounded-xl shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invite to Room</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4 p-4 bg-white rounded-lg border border-slate-200 dark:border-[#303030]">
          <QRCodeSVG value={shareUrl} size={180} />
        </div>

        {/* Room code */}
        <div className="text-center mb-4">
          <div className="text-xs text-slate-500 dark:text-[#888888] mb-1">Room Code</div>
          <div className="text-2xl font-mono font-bold tracking-widest text-slate-900 dark:text-white">
            {roomCode}
          </div>
        </div>

        {/* Link + Copy */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#181818] rounded-lg border border-slate-200 dark:border-[#303030]">
          <span className="flex-1 text-sm text-slate-600 dark:text-[#aaaaaa] truncate">{shareUrl}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition-colors shrink-0"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
