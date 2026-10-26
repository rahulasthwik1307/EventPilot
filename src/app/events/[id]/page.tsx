'use client';

import React, { useCallback, Suspense, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { WorkspaceShell, UpdateEventOptions } from '../../../components/workspace/WorkspaceShell';
import { WorkspaceTab } from '../../../components/workspace/WorkspaceNavigation';
import { AlertCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useEventWorkspace } from '../../../features/events/useEventWorkspace';
import { eventStorage } from '../../../features/events/storage';
import { Event } from '../../../features/events/types';

const VALID_TABS: WorkspaceTab[] = [
  'overview',
  'budget',
  'timeline',
  'vendors',
  'guests',
  'seating',
  'ai',
];

function EventWorkspaceView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const tabParam = searchParams.get('tab') as WorkspaceTab | null;

  // Resolve active tab: explicit query parameter has priority, fallback to last saved tab for this event, then 'overview'
  const activeTab: WorkspaceTab = useMemo(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
    if (typeof window !== 'undefined' && eventId) {
      const savedTab = eventStorage.getLastTab(eventId).data;
      if (savedTab && VALID_TABS.includes(savedTab)) {
        return savedTab;
      }
    }
    return 'overview';
  }, [tabParam, eventId]);

  const {
    event,
    mounted,
    notFound,
    storageError,
    concurrencyConflict,
    staleWarning,
    saveError,
    reloadLatest,
    updateEvent,
    resetSample,
    deleteEvent,
  } = useEventWorkspace(eventId);

  // Keep last visited tab and active event pointer in sync
  useEffect(() => {
    if (eventId && activeTab) {
      eventStorage.setLastTab(eventId, activeTab);
      eventStorage.setActiveEventId(eventId);
    }
  }, [eventId, activeTab]);

  const [dismissedConflict, setDismissedConflict] = useState(false);
  const [dismissedStale, setDismissedStale] = useState(false);
  const [dismissedSaveError, setDismissedSaveError] = useState(false);

  useEffect(() => {
    if (concurrencyConflict) setDismissedConflict(false);
  }, [concurrencyConflict]);

  useEffect(() => {
    if (staleWarning) setDismissedStale(false);
  }, [staleWarning]);

  useEffect(() => {
    if (saveError) setDismissedSaveError(false);
  }, [saveError]);

  const handleDeleteEvent = useCallback(() => {
    const success = deleteEvent();
    if (success) {
      router.push('/');
    }
  }, [deleteEvent, router]);

  const handleBackToWelcome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleTabChange = useCallback(
    (tab: WorkspaceTab) => {
      if (!eventId) return;
      eventStorage.setLastTab(eventId, tab);
      eventStorage.setActiveEventId(eventId);
      const query = tab === 'overview' ? '' : `?tab=${tab}`;
      router.push(`/events/${eventId}${query}`);
    },
    [eventId, router]
  );

  const handleUpdateEvent = useCallback(
    (updated: Event, options?: UpdateEventOptions) => {
      updateEvent(updated, options);
    },
    [updateEvent]
  );

  // Guard against SSR / initial client hydration mismatch:
  // Render loading pulse identical to server until client has mounted.
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <span className="text-neutral-muted text-sm font-medium animate-pulse">
          Loading celebration workspace...
        </span>
      </div>
    );
  }

  if (storageError) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col justify-between">
        <header className="bg-neutral-surface py-5 px-4 sm:px-8 border-b border-neutral-border">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="font-display text-2xl font-bold text-neutral-text">Event Pilot</span>
            <span className="text-sm font-bold bg-primary-subtle text-secondary px-3 py-1 rounded-md">
              Almanac Studio
            </span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-status-danger-subtle text-status-danger flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-text mb-2">Storage Error</h1>
          <p className="text-neutral-muted mb-6 text-sm">{storageError}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm px-5 py-2.5 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Studio</span>
          </button>
        </main>

        <footer className="py-6 text-center text-xs text-neutral-muted border-t border-neutral-border bg-neutral-surface">
          Event Pilot · Panchang &amp; Utsav Almanac
        </footer>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col justify-between">
        <header className="bg-neutral-surface py-5 px-4 sm:px-8 border-b border-neutral-border">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-neutral-text">Event Pilot</span>
              <span className="text-sm font-bold bg-primary-subtle text-secondary px-3 py-1 rounded-md">
                Almanac Studio
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-text mb-2">
            Celebration Not Found
          </h1>
          <p className="text-neutral-muted mb-6 text-sm leading-relaxed">
            This celebration could not be located in your browser storage. It may have been deleted or created in a different browser session.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm px-5 py-2.5 rounded-lg transition-all active:translate-y-0.5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Celebration Studio</span>
          </button>
        </main>

        <footer className="py-6 text-center text-xs text-neutral-muted border-t border-neutral-border bg-neutral-surface">
          Event Pilot · Panchang &amp; Utsav Almanac
        </footer>
      </div>
    );
  }

  return (
    <>
      {concurrencyConflict && !dismissedConflict && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-status-danger-subtle border-b border-status-danger/40 px-4 sm:px-6 lg:px-8 py-3 text-xs text-status-danger font-medium sticky top-0 z-50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Save Conflict:</strong> {concurrencyConflict.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reloadLatest}
                className="inline-flex items-center gap-1.5 bg-status-danger text-white font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Latest Celebration</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedConflict(true)}
                className="text-neutral-muted hover:text-neutral-text px-2 py-1 text-xs"
                aria-label="Dismiss conflict notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {staleWarning && !concurrencyConflict && !dismissedStale && (
        <div
          role="status"
          aria-live="polite"
          className="bg-status-warning-subtle border-b border-status-warning/40 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-status-warning font-medium sticky top-0 z-50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Celebration Updated Elsewhere:</strong> Another tab made changes to this celebration. Reload to synchronize your view.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reloadLatest}
                className="inline-flex items-center gap-1.5 bg-status-warning text-white font-semibold px-3 py-1 rounded-md hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Latest Celebration</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedStale(true)}
                className="text-neutral-muted hover:text-neutral-text px-2 py-1 text-xs"
                aria-label="Dismiss update notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {saveError && !concurrencyConflict && !dismissedSaveError && (
        <div
          role="alert"
          className="bg-status-danger-subtle border-b border-status-danger/40 px-4 sm:px-6 lg:px-8 py-3 text-xs text-status-danger font-medium sticky top-0 z-50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Save Failed:</strong> {saveError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedSaveError(true)}
              className="text-neutral-muted hover:text-neutral-text px-2 py-1 text-xs"
              aria-label="Dismiss error notice"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <WorkspaceShell
        event={event}
        initialTab={activeTab}
        onTabChange={handleTabChange}
        onUpdateEvent={handleUpdateEvent}
        onBackToWelcome={handleBackToWelcome}
        onResetSample={resetSample}
        onDeleteEvent={!event.isSample ? handleDeleteEvent : undefined}
      />
    </>
  );
}

export default function EventWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
          <span className="text-neutral-muted text-sm font-medium animate-pulse">
            Loading celebration workspace...
          </span>
        </div>
      }
    >
      <EventWorkspaceView />
    </Suspense>
  );
}
