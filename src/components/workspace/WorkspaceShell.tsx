'use client';

import React, { useState } from 'react';
import { Event } from '../../features/events/types';
import { WorkspaceHeader } from './WorkspaceHeader';
import { SampleBanner } from './SampleBanner';
import { WorkspaceNavigation, WorkspaceTab } from './WorkspaceNavigation';
import { OverviewTab } from './OverviewTab';
import { BudgetLedgerTab } from '../budget/BudgetLedgerTab';
import { TimelineTasksTab } from '../timeline/TimelineTasksTab';
import { ModulePlaceholder } from './ModulePlaceholder';
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

        {/* Stepped Navigation Rail */}
        <WorkspaceNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Planning Canvas */}
        <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8">
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

          {activeTab !== 'overview' && activeTab !== 'budget' && activeTab !== 'timeline' && (
            <ModulePlaceholder
              tab={activeTab}
              onReturnToOverview={() => setActiveTab('overview')}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-border py-6 px-4 sm:px-8 mt-12 bg-neutral-surface/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-muted gap-2">
          <p>
            Event Pilot · Milestone 2 · Local-First Celebration Planning Studio
          </p>
          <p className="font-mono tabular-nums">
            Panchang &amp; Utsav Almanac · WCAG 2.1 AA Compliant
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
