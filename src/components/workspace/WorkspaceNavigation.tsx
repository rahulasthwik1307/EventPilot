import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Clock,
  Briefcase,
  Users,
  Armchair,
  Sparkles,
} from 'lucide-react';

export type WorkspaceTab =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'guests'
  | 'seating'
  | 'ai';

export interface WorkspaceNavigationProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
}

export function WorkspaceNavigation({
  activeTab,
  onTabChange,
}: WorkspaceNavigationProps) {
  const tabs: {
    id: WorkspaceTab;
    label: string;
    index: string;
    icon: React.ComponentType<{ className?: string }>;
    hint: string;
  }[] = [
    { id: 'overview', label: 'Overview', index: '01', icon: LayoutDashboard, hint: 'Master Plan' },
    { id: 'budget', label: 'Budget Ledger', index: '02', icon: Wallet, hint: 'Cost Tracking' },
    { id: 'timeline', label: 'Timeline & Tasks', index: '03', icon: Clock, hint: 'Chronology' },
    { id: 'vendors', label: 'Vendors', index: '04', icon: Briefcase, hint: 'Contracts' },
    { id: 'guests', label: 'Guests & RSVP', index: '05', icon: Users, hint: 'Attendance' },
    { id: 'seating', label: 'Seating Planner', index: '06', icon: Armchair, hint: 'Banquet Layout' },
    { id: 'ai', label: 'AI Assistant', index: '07', icon: Sparkles, hint: 'Staged Advice' },
  ];

  return (
    <nav
      aria-label="Workspace navigation"
      className="bg-neutral-surface border border-neutral-border rounded-xl shadow-card p-2 sm:p-2.5 overflow-x-auto scrollbar-none"
    >
      <div className="hidden lg:flex items-center justify-between px-3 py-2 text-xs font-semibold text-neutral-muted border-b border-neutral-border mb-1.5">
        <span className="tracking-wide uppercase text-[11px]">Almanac Rail</span>
        <span className="font-mono text-[10px] bg-neutral-subtle border border-neutral-border px-1.5 py-0.5 rounded text-neutral-text">Keys 1–7</span>
      </div>

      <div className="flex lg:flex-col gap-1 sm:gap-1.5 min-w-max lg:min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={`group relative text-left inline-flex items-center justify-between gap-3 py-2.5 px-3 sm:px-3.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap lg:w-full ${
                isActive
                  ? 'bg-primary-subtle text-neutral-text font-bold shadow-xs border border-primary/40 translate-x-0 lg:translate-x-1'
                  : 'bg-transparent text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary text-neutral-text shadow-xs'
                      : 'bg-neutral-subtle text-neutral-muted group-hover:text-neutral-text group-hover:bg-neutral-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>

                <div className="truncate">
                  <span className="block truncate font-semibold text-xs sm:text-sm">
                    {tab.label}
                  </span>
                  <span className="hidden lg:block text-xs font-sans text-neutral-muted font-normal leading-tight">
                    {tab.hint}
                  </span>
                </div>
              </div>

              {/* Fore-edge Stepped Tab Notch on Desktop */}
              <div className="hidden lg:flex items-center gap-1.5">
                <span
                  className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? 'bg-secondary text-white font-bold'
                      : 'bg-neutral-subtle text-neutral-muted group-hover:text-neutral-text'
                  }`}
                >
                  {tab.index}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
