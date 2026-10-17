'use client';

import { memo } from 'react';

interface SettingSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  /** Colour of the switch when on; "danger" is used for destructive settings such as locking the room. */
  tone?: 'default' | 'danger';
}

/** A labelled on/off setting row. The whole row is a label, so the hit area is the full 44px-high row. */
const SettingSwitch = ({ label, description, checked, onChange, tone = 'default' }: SettingSwitchProps) => (
  <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded bg-slate-50 p-2 dark:bg-[#181818]">
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-slate-900 dark:text-[#f1f1f1]">{label}</span>
      <span className="block text-xs text-slate-600 dark:text-[#aaaaaa]">{description}</span>
    </span>
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        checked ? (tone === 'danger' ? 'bg-red-600' : 'bg-blue-600') : 'bg-slate-200 dark:bg-[#404040]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

export default memo(SettingSwitch);
