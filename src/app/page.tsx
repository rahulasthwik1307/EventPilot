'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventType } from '../features/events/types';
import { eventStorage } from '../features/events/storage';
import { EditorialNocturneHero } from '../components/welcome/EditorialNocturneHero';
import { SavedEventsList } from '../components/welcome/SavedEventsList';
import { EventCreateDialog } from '../components/events/EventCreateDialog';
import { AlertCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [personalEvents, setPersonalEvents] = useState<Event[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [initialCreateType, setInitialCreateType] = useState<EventType>('wedding');
  const [storageError, setStorageError] = useState<string | null>(null);

  // Initialize and load personal events from storage on mount (always starts on Landing Page)
  useEffect(() => {
    setMounted(true);
    try {
      const listRes = eventStorage.getPersonalEvents();
      if (listRes.success && listRes.data) {
        setPersonalEvents(listRes.data);
      } else if (listRes.error) {
        setStorageError(listRes.error.message);
      }
    } catch {
      setStorageError('Failed to initialize local browser storage.');
    }

    // Warm up and prefetch sample workspace route so clicking navigation is instantaneous
    try {
      router.prefetch('/events/sample');
    } catch {
      // Ignored in non-browser/test environments
    }
  }, [router]);

  const handleOpenSample = () => {
    router.push('/events/sample');
  };

  const handleSelectEventType = (type: EventType) => {
    setInitialCreateType(type);
    setIsCreateDialogOpen(true);
  };

  const handleEventCreated = (newEvent: Event) => {
    setPersonalEvents((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);
    router.push(`/events/${newEvent.id}`);
  };

  const handleSelectSavedEvent = (id: string) => {
    router.push(`/events/${id}`);
  };

  const handleDeleteEvent = (id: string) => {
    const delRes = eventStorage.deletePersonalEvent(id);
    if (delRes.success) {
      setPersonalEvents((prev) => prev.filter((e) => e.id !== id));
    } else {
      setStorageError(delRes.error?.message || 'Failed to delete event from local storage.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col justify-between">
      <div>
        {/* Top Studio Bar */}
        <header className="bg-neutral-surface py-3.5 sm:py-5 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="font-display text-xl sm:text-2xl font-bold text-neutral-text whitespace-nowrap">
                Event Pilot
              </span>
              <span className="text-[13px] sm:text-sm font-bold bg-primary-subtle text-secondary px-2 sm:px-3 py-0.5 sm:py-1 rounded-md whitespace-nowrap">
                Almanac Studio
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-muted">
                  Design System
                </p>
                <p className="text-sm font-semibold text-neutral-text">
                  Panchang &amp; Utsav Almanac
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInitialCreateType('wedding');
                  setIsCreateDialogOpen(true);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-[13px] sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-md transition-all active:translate-y-0.5 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-text shrink-0" />
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
              className="flex items-center gap-2 bg-status-danger-subtle text-status-danger p-4 rounded-lg text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{storageError}</span>
            </div>
          </div>
        )}

        {/* Main Welcome Content */}
        <main id="main-content" className="max-w-6xl mx-auto w-full px-4 sm:px-8">
          <EditorialNocturneHero
            onOpenSample={handleOpenSample}
            onCreateEvent={() => {
              setInitialCreateType('wedding');
              setIsCreateDialogOpen(true);
            }}
            onSelectType={handleSelectEventType}
          />

          {mounted && (
            <SavedEventsList
              events={personalEvents}
              onSelectEvent={handleSelectSavedEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </main>
      </div>

      {/* Creation Modal */}
      <EventCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleEventCreated}
        initialType={initialCreateType}
      />

      {/* Product Footer */}
      <footer className="mt-16 py-8 border-t border-neutral-border bg-neutral-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-muted">
          <p className="font-medium text-neutral-text">
            Event Pilot · Your celebration, thoughtfully planned.
          </p>
          <p>
            Thoughtful planning · Clear budgets · Your data stays in your browser.
          </p>
          <p className="font-mono text-[11px]">
            Panchang &amp; Utsav Almanac
          </p>
        </div>
      </footer>
    </div>
  );
}
