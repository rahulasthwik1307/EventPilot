'use client';

import React, { useState } from 'react';
import { Event } from '../../features/events/types';
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

export interface WorkspaceShellProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
  onBackToWelcome: () => void;
  onResetSample: () => void;
  onDeleteEvent?: () => void;
}

export function WorkspaceShell({
  event,
  onUpdateEvent,
  onBackToWelcome,
  onResetSample,
  onDeleteEvent,
}: WorkspaceShellProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const handleEventUpdated = (updated: Event) => {
    onUpdateEvent(updated);
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
                onTabChange={setActiveTab}
              />
            </aside>

            {/* Main Planning Canvas with Tab Enter Animation */}
            <main className="flex-1 min-w-0">
              <div key={activeTab} className="animate-tab-enter">
                {activeTab === 'overview' && (
                  <OverviewTab
                    event={event}
                    onEdit={() => setIsEditDialogOpen(true)}
                    onNavigateTab={setActiveTab}
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
          <p className="font-mono tabular-nums text-neutral-text/90">
            Panchang &amp; Utsav Almanac
          </p>
        </div>
      </footer>

      {/* Edit Event Details Dialog */}
      <EventEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        event={event}
        onSuccess={handleEventUpdated}
      />
    </div>
  );
}
