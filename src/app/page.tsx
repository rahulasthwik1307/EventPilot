'use client';

import React, { useEffect, useState } from 'react';
import { Event, EventType } from '../features/events/types';
import { eventStorage } from '../features/events/storage';
import { WelcomeHero } from '../components/welcome/WelcomeHero';
import { EventTypeCards } from '../components/welcome/EventTypeCards';
import { SavedEventsList } from '../components/welcome/SavedEventsList';
import { EventCreateDialog } from '../components/events/EventCreateDialog';
import { WorkspaceShell } from '../components/workspace/WorkspaceShell';
import { CouponBadge } from '../components/ui/Badge';
import { AlertCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [personalEvents, setPersonalEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [initialCreateType, setInitialCreateType] = useState<EventType>('wedding');
  const [storageError, setStorageError] = useState<string | null>(null);

  // Initialize and load storage state on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const listRes = eventStorage.getPersonalEvents();
      if (listRes.success && listRes.data) {
        setPersonalEvents(listRes.data);
      } else if (listRes.error) {
        setStorageError(listRes.error.message);
      }

      // Check for previously active event
      const activeIdRes = eventStorage.getActiveEventId();
      if (activeIdRes.success && activeIdRes.data) {
        if (activeIdRes.data === 'sample-event-aarav-meera') {
          const sampleRes = eventStorage.getSampleEvent();
          if (sampleRes.success && sampleRes.data) {
            setActiveEvent(sampleRes.data);
          }
        } else {
          const found = listRes.data?.find((e) => e.id === activeIdRes.data);
          if (found) {
            setActiveEvent(found);
          }
        }
      }
    } catch {
      setStorageError('Failed to initialize local browser storage.');
    }
  }, []);

  const handleOpenSample = () => {
    const sampleRes = eventStorage.getSampleEvent();
    if (sampleRes.success && sampleRes.data) {
      eventStorage.setActiveEventId(sampleRes.data.id);
      setActiveEvent(sampleRes.data);
    }
  };

  const handleResetSample = () => {
    const resetRes = eventStorage.resetSampleEvent();
    if (resetRes.success && resetRes.data) {
      setActiveEvent(resetRes.data);
    }
  };

  const handleSelectEventType = (type: EventType) => {
    setInitialCreateType(type);
    setIsCreateDialogOpen(true);
  };

  const handleEventCreated = (newEvent: Event) => {
    setPersonalEvents((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);
    setActiveEvent(newEvent);
    eventStorage.setActiveEventId(newEvent.id);
  };

  const handleUpdateEvent = (updated: Event) => {
    setActiveEvent(updated);
    if (!updated.isSample) {
      setPersonalEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    }
  };

  const handleSelectSavedEvent = (id: string) => {
    const found = personalEvents.find((e) => e.id === id);
    if (found) {
      eventStorage.setActiveEventId(id);
      setActiveEvent(found);
    }
  };

  const handleDeleteEvent = (id: string) => {
    const delRes = eventStorage.deletePersonalEvent(id);
    if (delRes.success) {
      setPersonalEvents((prev) => prev.filter((e) => e.id !== id));
      if (activeEvent?.id === id) {
        setActiveEvent(null);
        eventStorage.setActiveEventId(null);
      }
    } else {
      setStorageError(delRes.error?.message || 'Failed to delete event from local storage.');
    }
  };

  const handleBackToWelcome = () => {
    setActiveEvent(null);
    eventStorage.setActiveEventId(null);
  };

  // If viewing an active event workspace, render WorkspaceShell
  if (mounted && activeEvent) {
    return (
      <WorkspaceShell
        event={activeEvent}
        onUpdateEvent={handleUpdateEvent}
        onBackToWelcome={handleBackToWelcome}
        onResetSample={handleResetSample}
        onDeleteEvent={!activeEvent.isSample ? () => handleDeleteEvent(activeEvent.id) : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col justify-between">
      <div>
        {/* Top Studio Bar */}
        <header className="border-b border-neutral-border bg-neutral-surface/80 py-4 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                Event Pilot
              </span>
              <CouponBadge variant="terracotta">Almanac Studio</CouponBadge>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs uppercase font-semibold text-neutral-muted tracking-wider">
                  Design System
                </p>
                <p className="text-xs font-medium text-neutral-text">
                  Panchang &amp; Utsav Almanac
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInitialCreateType('wedding');
                  setIsCreateDialogOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-neutral-text hover:text-white font-semibold text-xs px-3.5 py-2 rounded-md transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-neutral-text" />
                <span>New Event</span>
              </button>
            </div>
          </div>
        </header>

        {/* Global Storage Error Notice (if any) */}
        {storageError && (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4">
            <div
              role="alert"
              className="flex items-center gap-2 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3 rounded-md text-xs"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{storageError}</span>
            </div>
          </div>
        )}

        {/* Main Welcome Content */}
        <main className="max-w-6xl mx-auto w-full px-6 sm:px-8 md:px-12">
          <WelcomeHero
            onOpenSample={handleOpenSample}
            onCreateEvent={() => {
              setInitialCreateType('wedding');
              setIsCreateDialogOpen(true);
            }}
          />

          <EventTypeCards onSelectType={handleSelectEventType} />

          {mounted && (
            <SavedEventsList
              events={personalEvents}
              onSelectEvent={handleSelectSavedEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-border py-8 px-4 sm:px-8 mt-16 bg-neutral-surface/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-muted gap-3">
          <p>
            Event Pilot · Challenge 5: Celebration &amp; Event Planner · Milestone 1
          </p>
          <p className="font-mono tabular-nums">
            Deterministic Math Engine · Browser-Local Persistence · WCAG 2.1 AA
          </p>
        </div>
      </footer>

      {/* Event Creation Modal */}
      <EventCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleEventCreated}
        initialType={initialCreateType}
      />
    </div>
  );
}
