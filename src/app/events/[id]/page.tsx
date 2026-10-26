'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Event } from '../../../features/events/types';
import { eventStorage } from '../../../features/events/storage';
import { WorkspaceShell } from '../../../components/workspace/WorkspaceShell';
import { WorkspaceTab } from '../../../components/workspace/WorkspaceNavigation';
import { AlertCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

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
  const [event, setEvent] = useState<Event | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

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

  const handleUpdateEvent = useCallback((updated: Event) => {
    setEvent(updated);
    if (updated.isSample) {
      eventStorage.saveSampleEvent(updated);
    } else {
      eventStorage.savePersonalEvent(updated);
    }
  }, []);

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

  if (!mounted) {
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
    <WorkspaceShell
      event={event}
      initialTab={activeTab}
      onTabChange={handleTabChange}
      onUpdateEvent={handleUpdateEvent}
      onBackToWelcome={handleBackToWelcome}
      onResetSample={handleResetSample}
      onDeleteEvent={!event.isSample ? handleDeleteEvent : undefined}
    />
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
