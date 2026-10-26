'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Event, SaveEventOptions } from '../../../features/events/types';
import { eventStorage, STORAGE_KEYS } from '../../../features/events/storage';
import { WorkspaceShell, UpdateEventOptions } from '../../../components/workspace/WorkspaceShell';
import { WorkspaceTab } from '../../../components/workspace/WorkspaceNavigation';
import { AlertCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

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
  const activeTab: WorkspaceTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  const [mounted, setMounted] = useState(false);
  const [event, setEvent] = useState<Event | null>(() => {
    if (typeof window === 'undefined' || !eventId) return null;
    try {
      if (eventId === 'sample' || eventId === 'sample-event-aarav-meera') {
        const sampleRes = eventStorage.getSampleEvent();
        if (sampleRes.success && sampleRes.data) return sampleRes.data;
      } else {
        const listRes = eventStorage.getPersonalEvents();
        if (listRes.success && listRes.data) {
          return listRes.data.find((e) => e.id === eventId) || null;
        }
      }
    } catch {
      // Fall through to useEffect
    }
    return null;
  });
  const [notFound, setNotFound] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [concurrencyConflict, setConcurrencyConflict] = useState<{
    message: string;
  } | null>(null);
  const [staleWarning, setStaleWarning] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleReloadLatest = useCallback(() => {
    if (!eventId) return;
    try {
      if (eventId === 'sample' || eventId === 'sample-event-aarav-meera') {
        const sampleRes = eventStorage.getSampleEvent();
        if (sampleRes.success && sampleRes.data) {
          setEvent(sampleRes.data);
          setConcurrencyConflict(null);
          setStaleWarning(false);
          setSaveError(null);
        } else {
          setStorageError(sampleRes.error?.message || 'Failed to reload sample event sandbox.');
        }
      } else {
        const listRes = eventStorage.getPersonalEvents();
        if (listRes.success && listRes.data) {
          const found = listRes.data.find((e) => e.id === eventId);
          if (found) {
            setEvent(found);
            setConcurrencyConflict(null);
            setStaleWarning(false);
            setSaveError(null);
          } else {
            setNotFound(true);
          }
        } else {
          setStorageError(listRes.error?.message || 'Failed to reload celebrations from storage.');
        }
      }
    } catch {
      setStorageError('Failed to access local browser storage.');
    }
  }, [eventId]);

  useEffect(() => {
    setMounted(true);
    if (!eventId) return;

    try {
      if (eventId === 'sample' || eventId === 'sample-event-aarav-meera') {
        const sampleRes = eventStorage.getSampleEvent();
        if (sampleRes.success && sampleRes.data) {
          setEvent(sampleRes.data);
        } else {
          setStorageError(sampleRes.error?.message || 'Failed to load sample event sandbox.');
        }
      } else {
        const listRes = eventStorage.getPersonalEvents();
        if (listRes.success && listRes.data) {
          const found = listRes.data.find((e) => e.id === eventId);
          if (found) {
            setEvent(found);
          } else {
            setNotFound(true);
          }
        } else {
          setStorageError(listRes.error?.message || 'Failed to load celebrations from storage.');
        }
      }
    } catch {
      setStorageError('Failed to access local browser storage.');
    }
  }, [eventId]);

  // Safe cross-tab storage change detection
  useEffect(() => {
    if (typeof window === 'undefined' || !eventId) return;

    const handleStorageChange = (e: StorageEvent) => {
      const isPersonalKey = e.key === STORAGE_KEYS.PERSONAL_EVENTS;
      const isSampleKey = e.key === STORAGE_KEYS.SAMPLE_EVENT;

      if (!isPersonalKey && !isSampleKey) return;

      const isSampleRoute = eventId === 'sample' || eventId === 'sample-event-aarav-meera';

      if (isSampleRoute && isSampleKey) {
        if (!e.newValue) {
          return;
        }
        try {
          const sampleRes = eventStorage.getSampleEvent();
          if (sampleRes.success && sampleRes.data) {
            const latest = sampleRes.data;
            if (
              event &&
              ((typeof latest.version === 'number' &&
                typeof event.version === 'number' &&
                latest.version > event.version) ||
                (latest.updatedAt && event.updatedAt && latest.updatedAt !== event.updatedAt))
            ) {
              setStaleWarning(true);
            }
          }
        } catch {
          // Safe error catch
        }
      } else if (!isSampleRoute && isPersonalKey) {
        if (!e.newValue) {
          setNotFound(true);
          return;
        }
        try {
          const listRes = eventStorage.getPersonalEvents();
          if (listRes.success && listRes.data) {
            const found = listRes.data.find((item) => item.id === eventId);
            if (!found) {
              // Current event was deleted in another tab
              setNotFound(true);
              return;
            }
            if (
              event &&
              ((typeof found.version === 'number' &&
                typeof event.version === 'number' &&
                found.version > event.version) ||
                (found.updatedAt && event.updatedAt && found.updatedAt !== event.updatedAt))
            ) {
              setStaleWarning(true);
            }
          }
        } catch {
          // Safe error catch
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [eventId, event]);

  const handleUpdateEvent = useCallback(
    (updated: Event, options?: UpdateEventOptions) => {
      if (!event) return;

      if (options?.alreadySaved) {
        // Already persisted to storage with optimistic concurrency checks in modal
        const latestStored = updated.isSample
          ? eventStorage.getSampleEvent().data
          : eventStorage.getPersonalEvent(updated.id).data;
        setEvent(latestStored || updated);
        setConcurrencyConflict(null);
        setStaleWarning(false);
        setSaveError(null);
        return;
      }

      // Concurrency check options MUST be derived strictly from the active snapshot `event`
      // from which `updated` was derived, NOT from stale or future values.
      const saveOptions: SaveEventOptions = {
        expectedVersion: event.version ?? 1,
        expectedUpdatedAt: event.updatedAt,
      };

      if (updated.isSample) {
        const saveRes = eventStorage.saveSampleEvent(updated, saveOptions);
        if (saveRes.success) {
          const savedEvent =
            saveRes.data ||
            eventStorage.getSampleEvent().data || {
              ...updated,
              version: (event.version ?? 1) + 1,
            };
          setEvent(savedEvent);
          setConcurrencyConflict(null);
          setStaleWarning(false);
          setSaveError(null);
        } else if (saveRes.error?.code === 'CONCURRENCY_CONFLICT') {
          // Do NOT update React state. Surface recoverable conflict.
          setConcurrencyConflict({
            message:
              saveRes.error.message ||
              'The sample celebration workspace has been updated in another session. Please reload to review the latest changes.',
          });
        } else {
          setSaveError(saveRes.error?.message || 'Failed to save sample event sandbox state.');
        }
      } else {
        const saveRes = eventStorage.savePersonalEvent(updated, saveOptions);
        if (saveRes.success) {
          const savedEvent =
            saveRes.data ||
            eventStorage.getPersonalEvent(updated.id).data || {
              ...updated,
              version: (event.version ?? 1) + 1,
            };
          setEvent(savedEvent);
          setConcurrencyConflict(null);
          setStaleWarning(false);
          setSaveError(null);
        } else if (saveRes.error?.code === 'CONCURRENCY_CONFLICT') {
          // Do NOT update React state. Surface recoverable conflict.
          setConcurrencyConflict({
            message:
              saveRes.error.message ||
              'The celebration workspace has been updated in another session. Please reload to review the latest changes.',
          });
        } else {
          setSaveError(saveRes.error?.message || 'Failed to save personal event to storage.');
        }
      }
    },
    [event]
  );

  const handleResetSample = useCallback(() => {
    const resetRes = eventStorage.resetSampleEvent();
    if (resetRes.success && resetRes.data) {
      setEvent(resetRes.data);
    }
  }, []);

  const handleDeleteEvent = useCallback(() => {
    if (!eventId) return;
    const delRes = eventStorage.deletePersonalEvent(eventId);
    if (delRes.success) {
      router.push('/');
    } else {
      setStorageError(delRes.error?.message || 'Failed to delete event from local storage.');
    }
  }, [eventId, router]);

  const handleBackToWelcome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleTabChange = useCallback(
    (tab: WorkspaceTab) => {
      if (!eventId) return;
      const query = tab === 'overview' ? '' : `?tab=${tab}`;
      router.push(`/events/${eventId}${query}`);
    },
    [eventId, router]
  );

  if (!mounted && !event) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <span className="text-neutral-muted text-sm font-medium animate-pulse">
          Opening celebration workspace...
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

  if (notFound) {
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

  if (!event) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <span className="text-neutral-muted text-sm font-medium animate-pulse">
          Loading celebration workspace...
        </span>
      </div>
    );
  }

  return (
    <>
      {concurrencyConflict && (
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
                onClick={handleReloadLatest}
                className="inline-flex items-center gap-1.5 bg-status-danger text-white font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Latest Celebration</span>
              </button>
              <button
                type="button"
                onClick={() => setConcurrencyConflict(null)}
                className="text-neutral-muted hover:text-neutral-text px-2 py-1 text-xs"
                aria-label="Dismiss conflict notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {staleWarning && !concurrencyConflict && (
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
                onClick={handleReloadLatest}
                className="inline-flex items-center gap-1.5 bg-status-warning text-white font-semibold px-3 py-1 rounded-md hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Latest Celebration</span>
              </button>
              <button
                type="button"
                onClick={() => setStaleWarning(false)}
                className="text-neutral-muted hover:text-neutral-text px-2 py-1 text-xs"
                aria-label="Dismiss update notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {saveError && !concurrencyConflict && (
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
              onClick={() => setSaveError(null)}
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
        onResetSample={handleResetSample}
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
            Loading celebration...
          </span>
        </div>
      }
    >
      <EventWorkspaceView />
    </Suspense>
  );
}
