'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { CouponBadge } from '../../ui/Badge';
import { WorkspaceTab } from '../WorkspaceNavigation';

export interface AiAdvisorDockProps {
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export function AiAdvisorDock({ onNavigateTab }: AiAdvisorDockProps) {
  return (
    <section className="bg-primary-subtle border border-primary/40 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-lg bg-primary text-neutral-text shadow-sm shrink-0">
          <Sparkles className="w-5 h-5 text-neutral-text" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base sm:text-lg font-bold text-neutral-text">
              AI Celebration Advisor
            </h3>
            <CouponBadge variant="marigold">Smart Staged Diff</CouponBadge>
          </div>
          <p className="text-xs text-neutral-text/90 max-w-xl leading-relaxed">
            Synthesize ritual traditions, detect budget variance, and receive structured proposals. Every change is presented as a before/after review diff before touching your live event.
          </p>
        </div>
      </div>

      {onNavigateTab && (
        <button
          type="button"
          onClick={() => onNavigateTab('ai')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-neutral-text font-bold text-xs hover:bg-primary-hover shadow-sm transition-all shrink-0 active:scale-[0.98]"
        >
          <span>Consult AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </section>
  );
}
