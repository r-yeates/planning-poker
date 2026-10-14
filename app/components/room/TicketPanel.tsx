'use client';

import { memo, useState } from 'react';
import { parseTicketLine, type Ticket, type TicketSource } from '@/lib/tickets';

const SOURCE_LABELS: Record<TicketSource, string> = {
  jira: 'Jira',
  github: 'GitHub',
  linear: 'Linear',
  link: 'Link',
};

/** Key + source chip, e.g. "Jira ABC-123". Shared by the backlog and the summary. */
export function TicketBadge({ ticket }: { ticket: Pick<Ticket, 'key' | 'source'> }) {
  if (!ticket.key && (!ticket.source || ticket.source === 'link')) return null;
  return (
    <span className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-[#303030] text-slate-700 dark:text-[#cccccc]">
      {ticket.source && ticket.source !== 'link' && (
        <span className="font-sans font-medium text-slate-500 dark:text-[#888888]">{SOURCE_LABELS[ticket.source]}</span>
      )}
      {ticket.key}
    </span>
  );
}

export function TicketLink({ url, className = '' }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 ${className}`}
      title="Open ticket"
      aria-label="Open ticket in a new tab"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

interface TicketPanelProps {
  ticket: Ticket | null | undefined;
  isAdmin: boolean;
  onSave: (text: string) => Promise<boolean>;
}

function TicketPanel({ ticket, isAdmin, onSave }: TicketPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const preview = draft.trim() ? parseTicketLine(draft) : null;

  const startEditing = () => {
    setDraft(ticket ? [ticket.url, ticket.key && !ticket.url ? ticket.key : '', ticket.title].filter(Boolean).join(' ') : '');
    setEditing(true);
  };

  const save = async (text: string) => {
    setSaving(true);
    const ok = await onSave(text);
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (editing) {
    return (
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          save(draft);
        }}
      >
        <label htmlFor="ticket-input" className="block text-xs text-slate-500 dark:text-[#888888]">
          Paste a Jira, GitHub or Linear link, or type a title
        </label>
        <input
          id="ticket-input"
          autoFocus
          value={draft}
          maxLength={1000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          placeholder="ABC-123 Add password reset"
          className="w-full p-2 border border-slate-300 dark:border-[#404040] rounded bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f1f1f1] text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        />
        {preview && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#aaaaaa] min-w-0">
            <TicketBadge ticket={preview} />
            <span className="truncate">{preview.title}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm rounded text-slate-600 dark:text-[#aaaaaa] hover:bg-slate-100 dark:hover:bg-[#303030]">
            Cancel
          </button>
          {ticket && (
            <button type="button" disabled={saving} onClick={() => save('')} className="ml-auto px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:underline">
              Clear
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-slate-500 dark:text-[#888888]">Current Ticket</div>
        {isAdmin && (
          <button onClick={startEditing} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {ticket ? 'Edit' : '+ Set ticket'}
          </button>
        )}
      </div>
      {ticket ? (
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0 space-y-1">
            <TicketBadge ticket={ticket} />
            <div className="text-sm text-slate-800 dark:text-[#cccccc] font-medium line-clamp-3 break-words">{ticket.title}</div>
          </div>
          {ticket.url && <TicketLink url={ticket.url} className="mt-0.5" />}
        </div>
      ) : (
        <div className="text-sm text-slate-400 dark:text-[#777777]">
          {isAdmin ? 'Nothing set — add a ticket so everyone knows what they are estimating.' : 'No ticket set'}
        </div>
      )}
    </div>
  );
}

export default memo(TicketPanel);
