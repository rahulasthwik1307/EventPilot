'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WorkspaceTab } from '../WorkspaceNavigation';

export interface ActionRadarItem {
  id: string;
  title: string;
  detail: string;
  severity: 'urgent' | 'warning' | 'info';
  tab: WorkspaceTab;
  actionLabel: string;
}

export interface ActionRadarProps {
  items: ActionRadarItem[];
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export function ActionRadar({ items, onNavigateTab }: ActionRadarProps) {
  if (items.length === 0) {
    return (
      <section className="bg-status-success-subtle/40 border border-status-success/30 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-status-success font-medium">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
          <span>
            <strong>Celebration Radar Clear:</strong> All ritual milestones, budget allocations, and guest registrations are in healthy standing.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-neutral-muted text-[11px]">
          No active bottlenecks
        </span>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label="Action Radar"
      className="bg-secondary-subtle/30 border border-secondary/30 rounded-xl p-4 shadow-xs space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
          <h3 className="font-display text-sm sm:text-base font-bold text-neutral-text">
            Needs Attention Radar ({items.length} Urgent Items)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-secondary font-bold uppercase tracking-wider">
          Immediate Action Required
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-neutral-surface border border-neutral-border rounded-lg p-3 flex items-start justify-between gap-3 shadow-xs hover:border-secondary/40 transition-all"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span className="font-semibold text-xs text-neutral-text truncate">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-neutral-muted leading-relaxed pl-5">
                {item.detail}
              </p>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary-hover underline shrink-0 pl-1"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
