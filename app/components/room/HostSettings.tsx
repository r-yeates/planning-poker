'use client';

import { memo } from 'react';
import type { Room } from '@/lib/firebase';
import { ESTIMATION_SCALES, type ScaleType } from '@/lib/estimation-scales';
import SettingSwitch from './SettingSwitch';

interface HostSettingsProps {
  room: Room;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onChangeScale: (scale: ScaleType) => void;
  onToggleAutoReveal: () => void;
  onToggleAnonymous: () => void;
  onToggleTooltips: () => void;
  onToggleConfetti: () => void;
  onToggleLock: () => void;
}

/** Collapsible host-only room settings. */
function HostSettings({
  room,
  collapsed,
  onToggleCollapsed,
  onChangeScale,
  onToggleAutoReveal,
  onToggleAnonymous,
  onToggleTooltips,
  onToggleConfetti,
  onToggleLock,
}: HostSettingsProps) {
  return (
    <div className="border-t border-slate-200 dark:border-[#303030]">
      <button
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#303030] transition-colors"
      >
        <h3 className="text-base font-medium text-slate-800 dark:text-[#cccccc]">Room Settings</h3>
        <svg
          aria-hidden="true"
          className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-200 dark:border-[#303030] pt-3">
          <div className="space-y-1">
            <label htmlFor="estimation-scale" className="block text-sm font-medium text-slate-700 dark:text-[#cccccc]">
              Estimation Scale
            </label>
            <select
              id="estimation-scale"
              value={room.scaleType || 'fibonacci'}
              onChange={(e) => onChangeScale(e.target.value as ScaleType)}
              className="w-full p-2 border border-slate-300 dark:border-[#404040] rounded bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f1f1f1] focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {Object.values(ESTIMATION_SCALES).map((scale) => (
                <option key={scale.type} value={scale.type}>
                  {scale.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-600 dark:text-[#aaaaaa]">Changing the scale clears the current votes</p>
          </div>

          <SettingSwitch label="Auto-reveal votes" description="Auto-show when everyone votes" checked={!!room.autoReveal} onChange={onToggleAutoReveal} />
          <SettingSwitch label="Anonymous voting" description="Hides names in the UI only; revealed votes still carry user ids" checked={!!room.anonymousVoting} onChange={onToggleAnonymous} />
          <SettingSwitch label="Card tooltips" description="Show card descriptions" checked={!!room.showTooltips} onChange={onToggleTooltips} />
          <SettingSwitch label="Confetti celebrations" description="Show confetti on reveal" checked={!!room.confettiEnabled} onChange={onToggleConfetti} />
          <SettingSwitch label="Lock room" description="Prevent new participants from joining" checked={!!room.isLocked} onChange={onToggleLock} tone="danger" />
        </div>
      )}
    </div>
  );
}

export default memo(HostSettings);
