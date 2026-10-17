'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastKind = 'error' | 'success';

export interface ToastOptions {
  kind: ToastKind;
  title: string;
  description?: string;
  /** Toasts with the same key replace each other instead of stacking. */
  key?: string;
  /** Accessible name for the toast region (e.g. "New round started"). */
  label?: string;
  dismissLabel?: string;
  /** Auto-dismiss delay in ms. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

/**
 * Transient notifications. `show` adds a toast that auto-dismisses; all timers are
 * cleared on unmount. Render `region` once near the root of the page.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((current) => [...current.filter((t) => !options.key || t.key !== options.key), { ...options, id }]);
    timers.current.set(id, setTimeout(() => dismiss(id), options.duration ?? 5000));
    return id;
  }, [dismiss]);

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach(clearTimeout);
      active.clear();
    };
  }, []);

  const region = <ToastRegion toasts={toasts} onDismiss={dismiss} />;
  return { show, dismiss, region };
}

function ToastRegion({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const errors = toasts.filter((t) => t.kind === 'error');
  const successes = toasts.filter((t) => t.kind === 'success');
  return (
    <>
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
        {successes.map((t) => <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />)}
      </div>
      <div className="pointer-events-none fixed bottom-24 left-1/2 lg:bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col gap-2">
        {errors.map((t) => <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />)}
      </div>
    </>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const isError = toast.kind === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-label={toast.label}
      className={`toast-enter pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
        isError ? 'bg-red-700' : 'bg-green-700'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{toast.title}</div>
        {toast.description && <div className="opacity-90">{toast.description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={toast.dismissLabel ?? 'Dismiss'}
        className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
