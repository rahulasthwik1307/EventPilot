/**
 * Event Pilot Local Persistence Adapter
 * Provides robust, versioned localStorage persistence for personal events
 * while keeping sample event state strictly isolated.
 */

import { Event, EventStorage, SaveEventOptions, StorageError, StorageResult } from './types';
import { validateEvent } from './validation';
import { createFreshSampleEvent } from './sample-event';
import { generateStarterCategories } from './budget-engine';
import { generateStarterMilestones, generateStarterTasks } from './timeline-engine';

export const STORAGE_KEYS = {
  PERSONAL_EVENTS: 'event_pilot_personal_events_v1',
  SAMPLE_EVENT: 'event_pilot_sample_v1',
  ACTIVE_ID: 'event_pilot_active_id_v1',
} as const;

export interface StorageContainer<T> {
  schemaVersion: 1;
  payload: T;
  timestamp: string;
}

/**
 * Seamlessly migrates an Event from Milestone 1 to Milestone 2.
 * Preserves all existing fields, categories, and overrides while safely
 * generating default categories, milestones, and tasks if absent.
 * Strict Actual Spending Rule: Does NOT invent expenses or assume actual spending.
 */
export function migrateEventToM2(event: Event): Event {
  const categories =
    Array.isArray(event.categories) && event.categories.length > 0
      ? event.categories
      : generateStarterCategories(event.budgetCap, event.type);

  const expenses = Array.isArray(event.expenses) ? event.expenses : [];

  const milestones =
    Array.isArray(event.milestones) && event.milestones.length > 0
      ? event.milestones
      : generateStarterMilestones(event.type);

  const tasks =
    Array.isArray(event.tasks) && event.tasks.length > 0
      ? event.tasks
      : generateStarterTasks(milestones, event.date, event.type);

  return {
    ...event,
    categories,
    expenses,
    milestones,
    tasks,
  };
}

/**
 * Seamlessly migrates an Event from Milestone 1 or 2 to Milestone 3.
 * Preserves all existing fields, categories, and overrides while safely
 * initializing vendors, households, guests, tables, and assignments arrays if absent.
 * Cleans any orphaned assignments referencing non-existent tables or guests.
 * Strict Rule: Never fabricates vendors, guests, payments, tables, or assignments in personal events.
 */
export function migrateEventToM3(event: Event): Event {
  const m2 = migrateEventToM2(event);

  const vendors = Array.isArray(m2.vendors) ? m2.vendors : [];
  const households = Array.isArray(m2.households) ? m2.households : [];
  const guests = Array.isArray(m2.guests) ? m2.guests : [];
  const tables = Array.isArray(m2.tables) ? m2.tables : [];
  const rawAssignments = Array.isArray(m2.assignments) ? m2.assignments : [];

  const validTableIds = new Set(tables.map((t) => t.id));
  const validGuestIds = new Set(guests.map((g) => g.id));
  const assignments = rawAssignments.filter(
    (a) => a && validTableIds.has(a.tableId) && validGuestIds.has(a.guestId)
  );

  return {
    ...m2,
    vendors,
    households,
    guests,
    tables,
    assignments,
  };
}

export class LocalStorageEventStorage implements EventStorage {
  private isAvailable(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const testKey = '__ep_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private unavailableError(): StorageError {
    return {
      code: 'STORAGE_UNAVAILABLE',
      message: 'Browser localStorage is unavailable or blocked by security settings.',
    };
  }

  private handleStorageError(err: unknown, fallbackMessage: string): StorageError {
    if (err instanceof DOMException && (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22
    )) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: 'Browser storage quota exceeded. Please remove older events to free space.',
        cause: err,
      };
    }
    return {
      code: 'UNKNOWN',
      message: fallbackMessage,
      cause: err,
    };
  }

  getPersonalEvents(): StorageResult<Event[]> {
    if (!this.isAvailable()) {
      return { success: false, data: [], error: this.unavailableError() };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS);
      if (!raw) {
        return { success: true, data: [] };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        return {
          success: false,
          data: [],
          error: {
            code: 'PARSE_ERROR',
            message: 'Saved personal event data is corrupted and cannot be parsed.',
            cause: parseErr,
          },
        };
      }

      // Support container versioning or raw array
      let rawList: unknown[] = [];
      if (parsed && typeof parsed === 'object' && 'schemaVersion' in parsed && 'payload' in parsed) {
        const container = parsed as StorageContainer<unknown[]>;
        if (container.schemaVersion !== 1) {
          return {
            success: false,
            data: [],
            error: {
              code: 'VERSION_MISMATCH',
              message: `Incompatible storage version: ${String(container.schemaVersion)}`,
            },
          };
        }
        if (Array.isArray(container.payload)) {
          rawList = container.payload;
        }
      } else if (Array.isArray(parsed)) {
        rawList = parsed;
      }

      const validEvents: Event[] = [];
      for (const item of rawList) {
        const res = validateEvent(item);
        if (res.isValid && !res.data.isSample) {
          validEvents.push(migrateEventToM3(res.data));
        }
      }

      return { success: true, data: validEvents };
    } catch (err) {
      return {
        success: false,
        data: [],
        error: this.handleStorageError(err, 'Failed to retrieve personal events.'),
      };
    }
  }

  getPersonalEvent(id: string): StorageResult<Event | null> {
    const listRes = this.getPersonalEvents();
    if (!listRes.success || !listRes.data) {
      return { success: false, data: null, error: listRes.error };
    }
    const found = listRes.data.find((e) => e.id === id) || null;
    return { success: true, data: found };
  }

  savePersonalEvent(event: Event, options?: SaveEventOptions): StorageResult<void> {
    if (!this.isAvailable()) {
      return { success: false, error: this.unavailableError() };
    }

    // Force isSample = false for personal events and ensure M3 integrity
    const migrated = migrateEventToM3(event);
    const sanitized: Event = {
      ...migrated,
      isSample: false,
      updatedAt: new Date().toISOString(),
    };

    const val = validateEvent(sanitized);
    if (!val.isValid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: Object.values(val.errors).join(', '),
        },
      };
    }

    const currentListRes = this.getPersonalEvents();
    if (!currentListRes.success) {
      return { success: false, error: currentListRes.error };
    }
    const currentList = currentListRes.data || [];

    const existingIndex = currentList.findIndex((e) => e.id === sanitized.id);
    let nextList: Event[];

    if (existingIndex >= 0) {
      // Optimistic concurrency check (W3-01)
      if (options?.expectedUpdatedAt) {
        const storedUpdatedAt = currentList[existingIndex].updatedAt;
        if (storedUpdatedAt && storedUpdatedAt !== options.expectedUpdatedAt) {
          return {
            success: false,
            error: {
              code: 'CONCURRENCY_CONFLICT',
              message:
                'The event workspace has been updated in another session. Please reload to review the latest changes.',
            },
          };
        }
      }

      nextList = [...currentList];
      nextList[existingIndex] = sanitized;
    } else {
      nextList = [sanitized, ...currentList];
    }

    const container: StorageContainer<Event[]> = {
      schemaVersion: 1,
      payload: nextList,
      timestamp: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, JSON.stringify(container));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: this.handleStorageError(err, 'Failed to save personal event to storage.'),
      };
    }
  }

  deletePersonalEvent(id: string): StorageResult<void> {
    if (!this.isAvailable()) {
      return { success: false, error: this.unavailableError() };
    }

    const currentListRes = this.getPersonalEvents();
    if (!currentListRes.success) {
      return { success: false, error: currentListRes.error };
    }

    const currentList = currentListRes.data || [];
    const nextList = currentList.filter((e) => e.id !== id);

    const container: StorageContainer<Event[]> = {
      schemaVersion: 1,
      payload: nextList,
      timestamp: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, JSON.stringify(container));

      // If active event was deleted, clear active pointer
      const activeRes = this.getActiveEventId();
      if (activeRes.data === id) {
        this.setActiveEventId(null);
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: this.handleStorageError(err, 'Failed to delete event from storage.'),
      };
    }
  }

  getSampleEvent(): StorageResult<Event> {
    if (!this.isAvailable()) {
      // In SSR or storage disabled, return in-memory fresh sample
      return { success: true, data: createFreshSampleEvent() };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.SAMPLE_EVENT);
      if (!raw) {
        const fresh = createFreshSampleEvent();
        this.saveSampleEvent(fresh);
        return { success: true, data: fresh };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const fresh = createFreshSampleEvent();
        this.saveSampleEvent(fresh);
        return { success: true, data: fresh };
      }

      let sampleData = parsed;
      if (parsed && typeof parsed === 'object' && 'payload' in parsed) {
        sampleData = (parsed as StorageContainer<unknown>).payload;
      }

      const val = validateEvent(sampleData);
      if (val.isValid && val.data.isSample) {
        return { success: true, data: migrateEventToM3(val.data) };
      }

      const fresh = createFreshSampleEvent();
      this.saveSampleEvent(fresh);
      return { success: true, data: fresh };
    } catch {
      return { success: true, data: createFreshSampleEvent() };
    }
  }

  saveSampleEvent(event: Event, options?: SaveEventOptions): StorageResult<void> {
    if (!this.isAvailable()) {
      return { success: false, error: this.unavailableError() };
    }

    if (options?.expectedUpdatedAt) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.SAMPLE_EVENT);
        if (raw) {
          const parsed = JSON.parse(raw);
          const currentSample = (parsed && typeof parsed === 'object' && 'payload' in parsed)
            ? (parsed as StorageContainer<Event>).payload
            : parsed as Event;
          if (currentSample?.updatedAt && currentSample.updatedAt !== options.expectedUpdatedAt) {
            return {
              success: false,
              error: {
                code: 'CONCURRENCY_CONFLICT',
                message:
                  'The sample event workspace has been updated in another session. Please reload to review the latest changes.',
              },
            };
          }
        }
      } catch {
        // Parse error fallback proceeds to normal save
      }
    }

    const sampleEvent: Event = {
      ...migrateEventToM3(event),
      isSample: true,
      updatedAt: new Date().toISOString(),
    };

    const container: StorageContainer<Event> = {
      schemaVersion: 1,
      payload: sampleEvent,
      timestamp: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEYS.SAMPLE_EVENT, JSON.stringify(container));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: this.handleStorageError(err, 'Failed to save sample event sandbox state.'),
      };
    }
  }

  resetSampleEvent(): StorageResult<Event> {
    const fresh = createFreshSampleEvent();
    const saveRes = this.saveSampleEvent(fresh);
    if (!saveRes.success) {
      return { success: false, data: fresh, error: saveRes.error };
    }
    return { success: true, data: fresh };
  }

  getActiveEventId(): StorageResult<string | null> {
    if (!this.isAvailable()) {
      return { success: true, data: null };
    }
    try {
      const id = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
      return { success: true, data: id || null };
    } catch {
      return { success: true, data: null };
    }
  }

  setActiveEventId(id: string | null): StorageResult<void> {
    if (!this.isAvailable()) {
      return { success: false, error: this.unavailableError() };
    }
    try {
      if (id) {
        window.localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: this.handleStorageError(err, 'Failed to set active event identifier.'),
      };
    }
  }
}

export const eventStorage = new LocalStorageEventStorage();
