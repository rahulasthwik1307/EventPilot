'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Event, UpdateEventOptions } from '../../features/events/types';
import { WorkspaceHeader } from './WorkspaceHeader';
import { SampleBanner } from './SampleBanner';
import { WorkspaceNavigation, WorkspaceTab } from './WorkspaceNavigation';
import { OverviewTab } from './OverviewTab';
import { BudgetLedgerTab } from '../budget/BudgetLedgerTab';
import { TimelineTasksTab } from '../timeline/TimelineTasksTab';
import { VendorsTab } from '../vendors/VendorsTab';
import { GuestsTab } from '../guests/GuestsTab';
import { SeatingTab } from '../seating/SeatingTab';
import { AiAssistantTab } from '../ai/AiAssistantTab';
import { EventEditDialog } from '../events/EventEditDialog';
import { DynamicReplanningModal } from '../replanning/DynamicReplanningModal';
import { Dialog } from '../ui/Dialog';

export type { UpdateEventOptions };

export interface WorkspaceShellProps {
  event: Event;
  onUpdateEvent: (updated: Event, options?: UpdateEventOptions) => void;
  onBackToWelcome: () => void;
  onResetSample: () => void;
  onDeleteEvent?: () => void;
  initialTab?: WorkspaceTab;
  onTabChange?: (tab: WorkspaceTab) => void;
}

export function WorkspaceShell({
  event,
  onUpdateEvent,
  onBackToWelcome,
  onResetSample,
  onDeleteEvent,
  initialTab = 'overview',
  onTabChange,
}: WorkspaceShellProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReplanningOpen, setIsReplanningOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = useCallback(
    (tab: WorkspaceTab) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  // Global Keyboard Shortcuts (Tabs 1-7, '?' for cheatsheet, Esc for dialogs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isAnyModalOpen = Boolean(document.querySelector('[role="dialog"]'));

      if (e.key === '?') {
        if (!isAnyModalOpen || isShortcutsDialogOpen) {
          e.preventDefault();
          setIsShortcutsDialogOpen((prev) => !prev);
        }
        return;
      }

      // If any modal dialog is active, isolate and prevent workspace tab navigation
      if (isAnyModalOpen || target?.closest?.('[role="dialog"]')) {
        return;
      }

      const tabMap: Record<string, WorkspaceTab> = {
        '1': 'overview',
        '2': 'budget',
        '3': 'timeline',
        '4': 'vendors',
        '5': 'guests',
        '6': 'seating',
        '7': 'ai',
      };

      if (tabMap[e.key]) {
        e.preventDefault();
        handleTabChange(tabMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange, isShortcutsDialogOpen]);

  const handleEventUpdated = (updated: Event, options?: UpdateEventOptions) => {
    onUpdateEvent(updated, options);
    setLastSavedAt(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col justify-between">
      <div>
        {/* Sample Sandbox Notice */}
        {event.isSample && <SampleBanner onResetSample={onResetSample} />}

        {/* Workspace Top Header */}
        <WorkspaceHeader
          event={event}
          onEdit={() => setIsEditDialogOpen(true)}
          onReplan={() => setIsReplanningOpen(true)}
          onBackToWelcome={onBackToWelcome}
          onDeleteEvent={onDeleteEvent}
        />

        {/* Responsive Workspace Grid: Lateral Fore-Edge Nav on Desktop, Dock on Mobile */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="lg:flex lg:gap-8 lg:items-start">
            {/* Stepped Lateral Fore-Edge Almanac Rail */}
            <aside className="lg:w-60 lg:flex-shrink-0 mb-6 lg:mb-0 lg:sticky lg:top-6">
              <WorkspaceNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </aside>

            {/* Main Planning Canvas with Tab Enter Animation */}
            <main className="flex-1 min-w-0">
              <div key={activeTab} className="animate-tab-enter">
                {activeTab === 'overview' && (
                  <OverviewTab
                    event={event}
                    onEdit={() => setIsEditDialogOpen(true)}
                    onReplan={() => setIsReplanningOpen(true)}
                    onNavigateTab={handleTabChange}
                    lastSavedAt={lastSavedAt}
                  />
                )}

                {activeTab === 'budget' && (
                  <BudgetLedgerTab
                    event={event}
                    onUpdateEvent={handleEventUpdated}
                  />
                )}

                {activeTab === 'timeline' && (
                  <TimelineTasksTab
                    event={event}
                    onUpdateEvent={handleEventUpdated}
                  />
                )}

                {activeTab === 'vendors' && (
                  <VendorsTab
                    event={event}
                    onUpdateEvent={handleEventUpdated}
                  />
                )}

                {activeTab === 'guests' && (
                  <GuestsTab
                    event={event}
                    onUpdateEvent={handleEventUpdated}
                  />
                )}

                {activeTab === 'seating' && (
                  <SeatingTab
                    event={event}
                    onUpdateEvent={handleEventUpdated}
                  />
                )}

                {activeTab === 'ai' && (
                  <AiAssistantTab
                    event={event}
                    onUpdateEvent={handleEventUpdated}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-border py-6 px-4 sm:px-8 mt-12 bg-neutral-surface/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-muted gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
            <p className="font-medium text-neutral-text">
              Event Pilot · Your celebration, thoughtfully planned.
            </p>
            <span className="hidden sm:inline text-neutral-border-strong">·</span>
            <p>
              Thoughtful planning · Clear budgets · Your data stays in your browser.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsShortcutsDialogOpen(true)}
              className="text-neutral-text/80 hover:text-secondary underline inline-flex items-center gap-1 font-mono text-xs transition-colors"
            >
              Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-neutral-subtle border border-neutral-border font-bold text-neutral-text text-[11px]">?</kbd>
            </button>
            <span className="text-neutral-border-strong">·</span>
            <p className="font-mono tabular-nums text-neutral-text/90">
              Panchang &amp; Utsav Almanac
            </p>
          </div>
        </div>
      </footer>

      {/* Edit Event Details Dialog */}
      <EventEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        event={event}
        onSuccess={(updated) => handleEventUpdated(updated, { alreadySaved: true })}
      />

      {/* Dynamic Celebration Replanner Studio */}
      <DynamicReplanningModal
        isOpen={isReplanningOpen}
        onClose={() => setIsReplanningOpen(false)}
        event={event}
        onApplyPlan={(updated) => handleEventUpdated(updated, { alreadySaved: true })}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <Dialog
        isOpen={isShortcutsDialogOpen}
        onClose={() => setIsShortcutsDialogOpen(false)}
        title="Almanac Keyboard Shortcuts"
        description="Speed up your planning workflow with direct keyboard navigation."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="space-y-2">
            <h4 className="font-sans font-semibold text-neutral-text text-sm">
              Tab Navigation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-text">
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>01 Overview</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">1</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>02 Budget Ledger</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">2</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>03 Timeline &amp; Tasks</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">3</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>04 Vendors</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">4</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>05 Guests &amp; RSVP</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">5</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>06 Seating Planner</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">6</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60 sm:col-span-2">
                <span>07 AI Assistant</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">7</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-border/60">
            <h4 className="font-sans font-semibold text-neutral-text text-sm">
              Dialog &amp; Form Controls
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-text">
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>Dismiss modal / dialog</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">Esc</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-subtle/60 border border-neutral-border/60">
                <span>Toggle shortcuts help</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border font-bold">?</kbd>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
