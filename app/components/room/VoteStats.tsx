'use client';

import { memo, useMemo } from 'react';
import { ESTIMATION_SCALES } from '@/lib/estimation-scales';
import { SPECIAL_VOTES } from '@/lib/room-shared';
import type { Room } from '@/lib/firebase';

type VoteValue = number | string;

const isSpecial = (v: VoteValue) => SPECIAL_VOTES.includes(v);
const label = (v: VoteValue) => (typeof v === 'number' ? `${v}pt` : v);

export function computeStats(room: Room) {
  const votes = Object.values(room.votes || {}).map((v) => v.value as VoteValue);
  if (!room.votesRevealed || votes.length === 0) return null;

  const order = ESTIMATION_SCALES[room.scaleType || 'fibonacci'].values;
  const position = (v: VoteValue) => {
    const i = order.indexOf(v);
    return i === -1 ? order.length : i;
  };

  const counts = new Map<VoteValue, number>();
  votes.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  const distribution = [...counts.entries()]
    .sort(([a], [b]) => position(a) - position(b))
    .map(([value, count]) => ({ value, count, percentage: (count / votes.length) * 100 }));

  // Only real estimates take part in the summary numbers; "?" and the coffee card do not
  const scored = votes.filter((v) => !isSpecial(v)).sort((a, b) => position(a) - position(b));
  const unsure = counts.get('?') || 0;
  const breaks = counts.get('☕') || 0;
  if (scored.length === 0) {
    return { distribution, total: votes.length, unsure, breaks, summary: null };
  }

  const allNumeric = scored.every((v): v is number => typeof v === 'number');
  const mid = Math.floor(scored.length / 2);
  const median: VoteValue = allNumeric && scored.length % 2 === 0
    ? ((scored[mid - 1] as number) + (scored[mid] as number)) / 2
    : scored[mid]; // for non-numeric scales an even split takes the higher (more cautious) middle

  const mostCommon = distribution
    .filter((d) => !isSpecial(d.value))
    .reduce((best, d) => (d.count >= best.count ? d : best)).value;

  const steps = position(scored[scored.length - 1]) - position(scored[0]);
  const average = allNumeric
    ? Math.round(((scored as number[]).reduce((a, b) => a + b, 0) / scored.length) * 10) / 10
    : null;
  const spread = allNumeric ? (scored[scored.length - 1] as number) - (scored[0] as number) : steps;

  return { distribution, total: votes.length, unsure, breaks, summary: { average, median, mostCommon, steps, spread, allNumeric } };
}

function insight(stats: NonNullable<ReturnType<typeof computeStats>>): string {
  const parts: string[] = [];
  const { summary } = stats;
  if (!summary) {
    parts.push('Nobody gave an estimate this round.');
  } else if (summary.steps === 0) {
    parts.push(`🎉 Perfect agreement! Everyone voted ${label(summary.mostCommon)}.`);
  } else if (summary.steps === 1) {
    parts.push(`✅ Strong alignment — votes are on neighbouring cards. Consider ${label(summary.mostCommon)}.`);
  } else if (summary.steps === 2) {
    parts.push(`💭 Moderate spread across ${summary.steps} steps. The median (${label(summary.median)}) may be a good compromise.`);
  } else {
    parts.push(`🗣️ Wide spread across ${summary.steps} steps. Have the highest and lowest voters explain their reasoning before deciding.`);
  }
  if (stats.unsure > 0) {
    parts.push(`${stats.unsure} ${stats.unsure === 1 ? 'person voted' : 'people voted'} “?” — clarify the requirements first.`);
  }
  if (stats.breaks > 0) {
    parts.push(`${stats.breaks} asked for a break ☕.`);
  }
  return parts.join(' ');
}

function VoteStats({ room }: { room: Room }) {
  const stats = useMemo(() => computeStats(room), [room.votes, room.votesRevealed, room.scaleType]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!stats) return null;
  const { summary } = stats;

  const cards = summary
    ? [
        ...(summary.average !== null ? [{ title: 'Average', value: summary.average, color: 'text-blue-600 dark:text-blue-400' }] : []),
        { title: 'Median', value: summary.median, color: 'text-purple-600 dark:text-purple-400' },
        { title: 'Most Common', value: summary.mostCommon, color: 'text-green-600 dark:text-green-400' },
        {
          title: summary.allNumeric ? 'Spread' : 'Spread (steps)',
          value: summary.spread,
          color: 'text-orange-600 dark:text-orange-400',
        },
      ]
    : [];

  return (
    <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-[#303030] p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Vote Distribution</h3>
        <div className="text-sm text-slate-600 dark:text-[#aaaaaa]">{stats.total} votes</div>
      </div>

      <div className="mb-6 space-y-3">
        {stats.distribution.map(({ value, count, percentage }) => (
          <div key={String(value)} className="flex items-center gap-3">
            <div className="w-12 text-sm font-medium text-slate-700 dark:text-[#cccccc]">{label(value)}</div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-slate-200 dark:bg-[#404040] rounded-full h-6 relative">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                >
                  <span className="text-white text-xs font-medium">{count}</span>
                </div>
              </div>
              <div className="w-12 text-sm text-slate-600 dark:text-[#aaaaaa]">{Math.round(percentage)}%</div>
            </div>
          </div>
        ))}
      </div>

      {cards.length > 0 && (
        <div className={`grid grid-cols-2 gap-4 ${cards.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {cards.map((c) => (
            <div key={c.title} className="text-center p-3 bg-slate-50 dark:bg-[#2a2a2a] rounded-lg">
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-slate-600 dark:text-[#aaaaaa]">{c.title}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-sm text-blue-800 dark:text-blue-200">{insight(stats)}</div>
      </div>
    </div>
  );
}

export default memo(VoteStats);
