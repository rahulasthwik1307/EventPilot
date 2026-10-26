'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event, SaveEventOptions, UpdateEventOptions } from './types';
import { eventStorage, STORAGE_KEYS } from './storage';

export type { UpdateEventOptions };

export interface UseEventWorkspaceReturn {
  event: Event | null;
  mounted: boolean;
  notFound: boolean;
  storageError: string | null;
  concurrencyConflict: { message: string } | null;
  staleWarning: boolean;
  saveError: string | null;
  reloadLatest: () => void;
  updateEvent: (updated: Event, options?: UpdateEventOptions) => void;
  resetSample: () => void;
  deleteEvent: () => boolean;
}

/**
 * useEventWorkspace Hook
 * Deep module encapsulating event resolution (sample vs personal),
 * optimistic concurrency version derivation, cross-tab collision detection,
 * and conflict recovery.
 */
export function useEventWorkspace(eventId: string | undefined): UseEventWorkspaceReturn {
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

  const reloadLatest = useCallback(() => {
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
          eventStorage.setActiveEventId(eventId);
        } else {
          setStorageError(sampleRes.error?.message || 'Failed to load sample event sandbox.');
        }
      } else {
        const listRes = eventStorage.getPersonalEvents();
        if (listRes.success && listRes.data) {
          const found = listRes.data.find((e) => e.id === eventId);
          if (found) {
            setEvent(found);
            eventStorage.setActiveEventId(eventId);
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

  const updateEvent = useCallback(
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

  const resetSample = useCallback(() => {
    const resetRes = eventStorage.resetSampleEvent();
    if (resetRes.success && resetRes.data) {
      setEvent(resetRes.data);
      setConcurrencyConflict(null);
      setStaleWarning(false);
      setSaveError(null);
    }
  }, []);

  const deleteEvent = useCallback((): boolean => {
    if (!eventId) return false;
    const delRes = eventStorage.deletePersonalEvent(eventId);
    if (delRes.success) {
      return true;
    } else {
      setStorageError(delRes.error?.message || 'Failed to delete event from local storage.');
      return false;
    }
  }, [eventId]);

  return {
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
  };
}
