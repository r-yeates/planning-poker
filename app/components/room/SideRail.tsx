'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface RailPanel {
  id: string;
  label: string;
  /** Small count shown next to the label, e.g. participants or unread messages. Hidden when 0 or undefined. */
  badge?: number;
  /** Receives whether the panel is the visible one. Every panel stays mounted so subscriptions keep running. */
  render: (active: boolean) => ReactNode;
}

interface SideRailProps {
  panels: RailPanel[];
  ariaLabel?: string;
}

/** Tabbed side panels (People / Backlog / Chat). Inactive panels are hidden, not unmounted. */
export default function SideRail({ panels, ariaLabel = 'Room panels' }: SideRailProps) {
  const [selected, setSelected] = useState(panels[0]?.id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // A panel can disappear (e.g. an emptied backlog for guests); fall back to the first one
  const activeId = panels.some((p) => p.id === selected) ? selected : panels[0]?.id;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = panels.length - 1;
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    const id = panels[next].id;
    setSelected(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <div className="space-y-3">
      {panels.length > 1 && (
        <div role="tablist" aria-label={ariaLabel} className="flex gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-[#181818]">
          {panels.map((panel, index) => {
            const isActive = panel.id === activeId;
            return (
              <button
                key={panel.id}
                ref={(el) => { tabRefs.current[panel.id] = el; }}
                role="tab"
                id={`rail-tab-${panel.id}`}
                aria-selected={isActive}
                aria-controls={`rail-panel-${panel.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setSelected(panel.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow dark:bg-[#303030] dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#aaaaaa] dark:hover:text-white'
                }`}
              >
                {panel.label}
                {!!panel.badge && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
                    <span className="sr-only">(</span>{panel.badge}<span className="sr-only">)</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {panels.map((panel) => {
        const isActive = panel.id === activeId;
        return (
          <div
            key={panel.id}
            role={panels.length > 1 ? 'tabpanel' : undefined}
            id={`rail-panel-${panel.id}`}
            aria-labelledby={panels.length > 1 ? `rail-tab-${panel.id}` : undefined}
            hidden={!isActive}
          >
            {panel.render(isActive)}
          </div>
        );
      })}
    </div>
  );
}
