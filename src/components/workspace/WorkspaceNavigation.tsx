import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Clock,
  Briefcase,
  Users,
  Sparkles,
} from 'lucide-react';

export type WorkspaceTab =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'guests'
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
    icon: React.ComponentType<{ className?: string }>;
    milestone?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Ledger', icon: Wallet },
    { id: 'timeline', label: 'Timeline & Tasks', icon: Clock },
    { id: 'vendors', label: 'Vendors', icon: Briefcase, milestone: 'M3' },
    { id: 'guests', label: 'Guests & Seating', icon: Users, milestone: 'M3' },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, milestone: 'M4' },
  ];

  return (
    <nav
      aria-label="Workspace navigation"
      className="bg-neutral-surface border-b border-neutral-border px-4 sm:px-8 overflow-x-auto scrollbar-none"
    >
      <div className="max-w-6xl mx-auto flex items-center space-x-1 sm:space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'border-primary text-neutral-text font-semibold bg-neutral-subtle/40'
                  : 'border-transparent text-neutral-muted hover:text-neutral-text hover:border-neutral-border-strong'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-primary' : 'text-neutral-muted'
                }`}
              />
              <span>{tab.label}</span>
              {tab.milestone && (
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-neutral-subtle border border-neutral-border text-neutral-muted">
                  {tab.milestone}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
