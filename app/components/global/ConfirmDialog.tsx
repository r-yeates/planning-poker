'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

/** In-app replacement for window.confirm. Render `dialog` once; `await confirm({...})` resolves to the choice. */
export function useConfirm(): { confirm: (options: ConfirmOptions) => Promise<boolean>; dialog: ReactNode } {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setOptions(next);
      }),
    []
  );

  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, settle]);

  const dialog = options && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => settle(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="bg-white dark:bg-[#212121] rounded-xl shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900 dark:text-[#f1f1f1]">{options.title}</h2>
        {options.message && <p className="mt-2 text-sm text-slate-600 dark:text-[#aaaaaa]">{options.message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => settle(false)}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#303030] text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors"
          >
            Cancel
          </button>
          <button
            autoFocus
            onClick={() => settle(true)}
            className={`px-4 py-2 text-sm rounded-lg text-white transition-colors ${
              options.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3b82f6] hover:bg-[#2563eb]'
            }`}
          >
            {options.confirmLabel ?? 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );

  return { confirm, dialog };
}
