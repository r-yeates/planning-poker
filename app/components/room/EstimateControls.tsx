'use client';

import { useEffect, useState } from 'react';
import { ESTIMATION_SCALES } from '@/lib/estimation-scales';
import { SPECIAL_VOTES } from '@/lib/room-shared';
import type { Room } from '@/lib/firebase';
import { computeStats } from './VoteStats';

type Estimate = number | string;

interface EstimateControlsProps {
  room: Room;
  isAdmin: boolean;
  onFinalize: (estimate: Estimate | null, advance: boolean) => Promise<boolean>;
  onRevote: () => void;
  onSkip: () => void;
}

/** Shown after reveal: the host records the agreed estimate; everyone sees it once saved. */
export default function EstimateControls({ room, isAdmin, onFinalize, onRevote, onSkip }: EstimateControlsProps) {
  const options = ESTIMATION_SCALES[room.scaleType || 'fibonacci'].values.filter((v) => !SPECIAL_VOTES.includes(v));
  const suggested = computeStats(room)?.summary?.mostCommon ?? null;
  const history = room.roundHistory || [];
  const recorded = room.roundRecorded ? history[history.length - 1]?.finalEstimate ?? null : null;

  const [selected, setSelected] = useState<Estimate | null>(recorded ?? suggested);
  const [saving, setSaving] = useState(false);

  // A new reveal brings a new suggestion
  useEffect(() => {
    setSelected(recorded ?? suggested);
  }, [suggested, recorded]);

  const backlog = room.backlog || [];
  const index = room.ticketIndex ?? null;
  const hasNext = (index === null ? 0 : index + 1) < backlog.length;

  if (!isAdmin) {
    return recorded !== null ? (
      <div className="text-center text-sm text-slate-700 dark:text-[#cccccc]">
        Final estimate: <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold">{recorded}</span>
      </div>
    ) : null;
  }

  const save = async (advance: boolean) => {
    if (selected === null) return;
    setSaving(true);
    await onFinalize(selected, advance);
    setSaving(false);
  };

  return (
    <div aria-busy={saving} className="w-full max-w-2xl mx-auto bg-white dark:bg-[#212121] border border-slate-200 dark:border-[#303030] rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-[#f1f1f1]">Final estimate</h3>
        {suggested !== null && <span className="text-xs text-slate-500 dark:text-[#888888]">Suggested: {suggested} (most common)</span>}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Final estimate">
        {options.map((value) => (
          <button
            key={String(value)}
            role="radio"
            aria-checked={selected === value}
            onClick={() => setSelected(value)}
            className={`min-w-[2.75rem] px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
              selected === value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#404040] text-slate-700 dark:text-[#cccccc] hover:border-blue-400'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => save(true)}
          disabled={saving || selected === null}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : hasNext ? 'Save & next ticket' : 'Save & new round'}
        </button>
        <button
          onClick={() => save(false)}
          disabled={saving || selected === null || selected === recorded}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-[#404040] text-sm text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#303030] disabled:opacity-50"
        >
          {recorded !== null ? 'Update' : 'Save'}
        </button>
        <span className="flex-1" />
        <button onClick={onRevote} disabled={saving} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-[#404040] text-sm text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#303030] disabled:opacity-50">
          Re-vote
        </button>
        <button onClick={onSkip} disabled={saving} className="px-2 py-2 rounded-lg text-sm text-slate-600 dark:text-[#aaaaaa] hover:underline disabled:opacity-50">
          {hasNext ? 'Skip to next' : 'New round'}
        </button>
      </div>
      {recorded !== null && <p role="status" className="text-xs text-green-700 dark:text-green-400">Saved as {recorded}.</p>}
    </div>
  );
}
