'use client';

import { useMemo, useState } from 'react';
import type { RoundResult } from '@/lib/firebase';
import { TicketBadge, TicketLink } from './TicketPanel';

interface SessionSummaryProps {
  roomCode: string;
  history: RoundResult[];
  onClose: () => void;
}

/** "5×2, 8×1" in vote order */
function voteBreakdown(round: RoundResult): string {
  const counts = new Map<string, number>();
  Object.values(round.votes || {}).forEach(({ value }) => counts.set(String(value), (counts.get(String(value)) || 0) + 1));
  return [...counts.entries()].map(([value, count]) => (count > 1 ? `${value}×${count}` : value)).join(', ');
}

const columns = ['Ticket', 'Key', 'URL', 'Final estimate', 'Votes', 'Completed'];

function rowsFor(history: RoundResult[]): string[][] {
  return history.map((r) => [
    r.ticket?.title ?? '(no ticket)',
    r.ticket?.key ?? '',
    r.ticket?.url ?? '',
    r.finalEstimate === null ? '' : String(r.finalEstimate),
    voteBreakdown(r),
    new Date(r.completedAt).toLocaleString(),
  ]);
}

/** Quote for CSV and neutralise spreadsheet formulas (=, +, -, @) in user-supplied text. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function SessionSummary({ roomCode, history, onClose }: SessionSummaryProps) {
  const [copied, setCopied] = useState(false);

  const totals = useMemo(() => {
    const estimated = history.filter((r) => r.finalEstimate !== null);
    const points = estimated.reduce((sum, r) => sum + (typeof r.finalEstimate === 'number' ? r.finalEstimate : 0), 0);
    const hasNumeric = estimated.some((r) => typeof r.finalEstimate === 'number');
    return { estimated: estimated.length, unestimated: history.length - estimated.length, points, hasNumeric };
  }, [history]);

  const copyTable = async () => {
    // Tab-separated pastes as a table into Sheets, Excel, Confluence and Jira
    const text = [columns, ...rowsFor(history)].map((row) => row.map((c) => c.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy to the clipboard. Use Download CSV instead.');
    }
  };

  const downloadCsv = () => {
    const csv = [columns, ...rowsFor(history)].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprintro-${roomCode}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-summary-title"
        className="bg-white dark:bg-[#212121] rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#303030]">
          <h2 id="session-summary-title" className="text-lg font-semibold text-slate-900 dark:text-white">Session Summary</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-5">
          <div className="text-center p-3 bg-slate-50 dark:bg-[#2a2a2a] rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totals.estimated}</div>
            <div className="text-xs text-slate-600 dark:text-[#aaaaaa]">Estimated</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-[#2a2a2a] rounded-lg">
            <div className="text-2xl font-bold text-slate-600 dark:text-[#cccccc]">{totals.unestimated}</div>
            <div className="text-xs text-slate-600 dark:text-[#aaaaaa]">Skipped</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-[#2a2a2a] rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totals.hasNumeric ? totals.points : '—'}</div>
            <div className="text-xs text-slate-600 dark:text-[#aaaaaa]">Total points</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-[#888888]">
              No rounds yet. Reveal votes and save an estimate to build the summary.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-[#212121]">
                <tr className="text-left text-xs text-slate-500 dark:text-[#888888] border-b border-slate-200 dark:border-[#303030]">
                  <th className="py-2 pr-2 font-medium">Ticket</th>
                  <th className="py-2 px-2 font-medium text-center">Estimate</th>
                  <th className="py-2 px-2 font-medium hidden sm:table-cell">Votes</th>
                  <th className="py-2 pl-2 font-medium text-right hidden sm:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {history.map((round, i) => (
                  <tr key={`${round.completedAt}-${i}`}>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {round.ticket && <TicketBadge ticket={round.ticket} />}
                        <span className="truncate text-slate-800 dark:text-[#cccccc]">{round.ticket?.title ?? <em className="text-slate-400">No ticket</em>}</span>
                        {round.ticket?.url && <TicketLink url={round.ticket.url} />}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {round.finalEstimate === null ? (
                        <span className="text-xs text-slate-400">skipped</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">{round.finalEstimate}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-600 dark:text-[#aaaaaa] hidden sm:table-cell">{voteBreakdown(round)}</td>
                    <td className="py-2 pl-2 text-right text-xs text-slate-500 dark:text-[#888888] hidden sm:table-cell whitespace-nowrap">
                      {new Date(round.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-[#303030]">
          <button
            onClick={copyTable}
            disabled={history.length === 0}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-[#404040] text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#303030] disabled:opacity-50"
          >
            {copied ? 'Copied!' : 'Copy as table'}
          </button>
          <button
            onClick={downloadCsv}
            disabled={history.length === 0}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
