'use client';

import { memo, useMemo, useState } from 'react';
import { parseTicketList, MAX_BACKLOG, type Ticket } from '@/lib/tickets';
import type { RoundResult } from '@/lib/firebase';
import { TicketBadge, TicketLink } from './TicketPanel';
import { useConfirm } from '@/app/components/global/ConfirmDialog';

interface BacklogPanelProps {
  backlog: Ticket[];
  ticketIndex: number | null;
  history: RoundResult[];
  isAdmin: boolean;
  /** Votes have been cast in an unrevealed round, so switching tickets would discard them */
  roundInProgress: boolean;
  onAdd: (text: string, mode: 'append' | 'replace') => Promise<boolean>;
  onRemove: (ticketId: string) => void;
  onGoTo: (index: number) => void;
}

function BacklogPanel({ backlog, ticketIndex, history, isAdmin, roundInProgress, onAdd, onRemove, onGoTo }: BacklogPanelProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const parsed = useMemo(() => parseTicketList(draft), [draft]);
  const { confirm, dialog: confirmDialog } = useConfirm();

  // Latest recorded estimate per ticket id
  const estimates = useMemo(() => {
    const map = new Map<string, number | string>();
    history.forEach((r) => {
      if (r.ticket && r.finalEstimate !== null) map.set(r.ticket.id, r.finalEstimate);
    });
    return map;
  }, [history]);

  if (!isAdmin && backlog.length === 0) return null;

  const goTo = async (index: number) => {
    if (!isAdmin || index === ticketIndex) return;
    if (roundInProgress && !(await confirm({ title: 'Switch tickets?', message: 'Votes have been cast for the current ticket. Switching discards them.', confirmLabel: 'Switch', destructive: true }))) return;
    onGoTo(index);
  };

  const submit = async (mode: 'append' | 'replace') => {
    if (mode === 'replace' && backlog.length > 0 && !(await confirm({ title: 'Replace backlog?', message: `This replaces all ${backlog.length} tickets in the backlog.`, confirmLabel: 'Replace', destructive: true }))) return;
    setSaving(true);
    const ok = await onAdd(draft, mode);
    setSaving(false);
    if (ok) {
      setDraft('');
      setAdding(false);
    }
  };

  const nextIndex = ticketIndex === null ? 0 : ticketIndex + 1;
  const overLimit = backlog.length + parsed.length > MAX_BACKLOG;

  return (
    <div className="bg-white dark:bg-[#212121] rounded-lg shadow border border-slate-200 dark:border-[#303030]">
      {confirmDialog}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-[#303030]">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-[#f1f1f1]">
          Backlog {backlog.length > 0 && <span className="font-normal text-slate-500">({estimates.size}/{backlog.length} estimated)</span>}
        </h3>
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => ticketIndex !== null && goTo(ticketIndex - 1)}
              disabled={ticketIndex === null || ticketIndex === 0}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-[#303030] disabled:opacity-30"
              title="Previous ticket"
              aria-label="Previous ticket"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => goTo(nextIndex)}
              disabled={nextIndex >= backlog.length}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-[#303030] disabled:opacity-30"
              title="Next ticket"
              aria-label="Next ticket"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => setAdding(!adding)} className="ml-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              {adding ? 'Close' : '+ Add'}
            </button>
          </div>
        )}
      </div>

      {adding && (
        <div className="p-3 space-y-2 border-b border-slate-200 dark:border-[#303030]">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder={'One ticket per line, e.g.\nhttps://acme.atlassian.net/browse/ABC-123\nABC-124 Add password reset\nhttps://github.com/acme/web/issues/42'}
            className="w-full p-2 border border-slate-300 dark:border-[#404040] rounded bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f1f1f1] text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
          <div className={`text-xs ${overLimit ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-[#888888]'}`}>
            {parsed.length} ticket{parsed.length === 1 ? '' : 's'} detected{overLimit && ` — the backlog is limited to ${MAX_BACKLOG}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => submit('append')}
              disabled={saving || parsed.length === 0 || overLimit}
              className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              Add to backlog
            </button>
            {backlog.length > 0 && (
              <button
                onClick={() => submit('replace')}
                disabled={saving || parsed.length === 0 || parsed.length > MAX_BACKLOG}
                className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-[#404040] text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#303030] disabled:opacity-50"
              >
                Replace
              </button>
            )}
          </div>
        </div>
      )}

      {backlog.length === 0 ? (
        <p className="px-3 py-3 text-xs text-slate-500 dark:text-[#888888]">Paste your sprint’s tickets to step through them one by one.</p>
      ) : (
        <ol className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2a2a2a]">
          {backlog.map((ticket, index) => {
            const isCurrent = index === ticketIndex;
            const estimate = estimates.get(ticket.id);
            return (
              <li
                key={ticket.id}
                className={`group flex items-center gap-2 px-3 py-2 text-sm ${
                  isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : isAdmin ? 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a] cursor-pointer' : ''
                }`}
                onClick={() => goTo(index)}
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span className="w-5 shrink-0 text-xs text-slate-400 tabular-nums">{index + 1}</span>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <TicketBadge ticket={ticket} />
                  <span className={`truncate ${isCurrent ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-[#cccccc]'}`}>
                    {ticket.title}
                  </span>
                </div>
                {estimate !== undefined && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    {estimate}
                  </span>
                )}
                {ticket.url && <TicketLink url={ticket.url} />}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(ticket.id);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 text-slate-400 hover:text-red-600"
                    title="Remove from backlog"
                    aria-label={`Remove ${ticket.title} from backlog`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default memo(BacklogPanel);
