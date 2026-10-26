import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageEventStorage, STORAGE_KEYS } from '../storage';
import { Event } from '../types';
import { getAiConversationStorageKey } from '../../ai/conversation-storage';

describe('LocalStorageEventStorage Adapter', () => {
  let storage: LocalStorageEventStorage;

  function createTestEvent(overrides: Partial<Event> = {}): Event {
    return {
      id: 'evt-personal-1',
      type: 'wedding',
      title: "Ananya & Dev's Vivaha",
      date: '2026-11-25',
      location: 'Bangalore Palace',
      guestTarget: 400,
      budgetCap: 3000000,
      currency: 'INR',
      categories: [],
      expenses: [],
      milestones: [],
      tasks: [],
      vendors: [],
      households: [],
      guests: [],
      tables: [],
      assignments: [],
      isSample: false,
      createdAt: '2026-10-21T12:00:00.000Z',
      updatedAt: '2026-10-21T12:00:00.000Z',
      ...overrides,
    };
  }

  beforeEach(() => {
    window.localStorage.clear();
    storage = new LocalStorageEventStorage();
  });

  describe('Personal Event Lifecycle', () => {
    const mockPersonalEvent = createTestEvent();

    it('returns empty array when storage is empty', () => {
      const res = storage.getPersonalEvents();
      expect(res.success).toBe(true);
      expect(res.data).toEqual([]);
    });

    it('saves a personal event and restores it cleanly', () => {
      const saveRes = storage.savePersonalEvent(mockPersonalEvent);
      expect(saveRes.success).toBe(true);

      const listRes = storage.getPersonalEvents();
      expect(listRes.success).toBe(true);
      expect(listRes.data).toHaveLength(1);
      expect(listRes.data?.[0].id).toBe(mockPersonalEvent.id);
      expect(listRes.data?.[0].title).toBe(mockPersonalEvent.title);
      expect(listRes.data?.[0].isSample).toBe(false);
    });

    it('retrieves an individual personal event by ID', () => {
      storage.savePersonalEvent(mockPersonalEvent);

      const foundRes = storage.getPersonalEvent(mockPersonalEvent.id);
      expect(foundRes.success).toBe(true);
      expect(foundRes.data?.id).toBe(mockPersonalEvent.id);

      const missingRes = storage.getPersonalEvent('non-existent-id');
      expect(missingRes.success).toBe(true);
      expect(missingRes.data).toBeNull();
    });

    it('updates an existing personal event correctly', () => {
      storage.savePersonalEvent(mockPersonalEvent);

      const updatedEvent: Event = {
        ...mockPersonalEvent,
        title: "Ananya & Dev's Grand Vivaha",
        guestTarget: 450,
      };

      const updateRes = storage.savePersonalEvent(updatedEvent);
      expect(updateRes.success).toBe(true);

      const listRes = storage.getPersonalEvents();
      expect(listRes.data).toHaveLength(1);
      expect(listRes.data?.[0].title).toBe("Ananya & Dev's Grand Vivaha");
      expect(listRes.data?.[0].guestTarget).toBe(450);
    });

    it('deletes a personal event without affecting other events', () => {
      const event2 = createTestEvent({
        id: 'evt-personal-2',
        type: 'birthday',
        title: "Vihaan's 1st Birthday",
        date: '2026-12-05',
        guestTarget: 40,
        budgetCap: 75000,
      });

      storage.savePersonalEvent(mockPersonalEvent);
      storage.savePersonalEvent(event2);

      expect(storage.getPersonalEvents().data).toHaveLength(2);

      const deleteRes = storage.deletePersonalEvent(mockPersonalEvent.id);
      expect(deleteRes.success).toBe(true);

      const remaining = storage.getPersonalEvents().data;
      expect(remaining).toHaveLength(1);
      expect(remaining?.[0].id).toBe(event2.id);
    });

    it('tracks the active event ID in local storage', () => {
      expect(storage.getActiveEventId().data).toBeNull();

      storage.setActiveEventId('evt-personal-1');
      expect(storage.getActiveEventId().data).toBe('evt-personal-1');

      storage.setActiveEventId(null);
      expect(storage.getActiveEventId().data).toBeNull();
    });
  });

  describe('Sample Event Isolation & Reset', () => {
    it('initializes sample celebration if none exists in storage', () => {
      const res = storage.getSampleEvent();
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('sample-event-aarav-meera');
      expect(res.data?.isSample).toBe(true);
      expect(res.data?.categories?.length).toBeGreaterThan(0);
    });

    it('persists edits to the sample celebration in isolation from personal events', () => {
      const personalEvent = createTestEvent({
        id: 'evt-personal-1',
        type: 'community',
        title: 'Neighborhood Diwali Mela',
        date: '2026-11-01',
        guestTarget: 500,
        budgetCap: 200000,
      });
      storage.savePersonalEvent(personalEvent);

      const sample = storage.getSampleEvent().data!;
      const editedSample: Event = {
        ...sample,
        title: 'Aarav & Meera Celebration (Edited Sandbox)',
        guestTarget: 400,
      };

      storage.saveSampleEvent(editedSample);

      // Verify sample updated
      const updatedSample = storage.getSampleEvent().data;
      expect(updatedSample?.title).toBe('Aarav & Meera Celebration (Edited Sandbox)');
      expect(updatedSample?.guestTarget).toBe(400);

      // Verify personal events untouched!
      const personalList = storage.getPersonalEvents().data;
      expect(personalList).toHaveLength(1);
      expect(personalList?.[0].title).toBe('Neighborhood Diwali Mela');
    });

    it('resetSampleEvent restores fresh starter data without deleting personal events', () => {
      const personalEvent = createTestEvent({
        id: 'evt-personal-1',
        type: 'community',
        title: 'Neighborhood Diwali Mela',
        date: '2026-11-01',
        guestTarget: 500,
        budgetCap: 200000,
      });
      storage.savePersonalEvent(personalEvent);

      const sample = storage.getSampleEvent().data!;
      storage.saveSampleEvent({ ...sample, title: 'Mutated Sample Title' });

      const resetRes = storage.resetSampleEvent();
      expect(resetRes.success).toBe(true);
      expect(resetRes.data?.title).toBe("Aarav & Meera's Vivaha Celebration");

      // Verify personal events still exist intact!
      const personalList = storage.getPersonalEvents().data;
      expect(personalList).toHaveLength(1);
      expect(personalList?.[0].id).toBe(personalEvent.id);
    });
  });

  describe('Error Handling & Storage Failure Modes', () => {
    it('returns PARSE_ERROR when localStorage payload is invalid JSON', () => {
      window.localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, '{"corrupted json');

      const res = storage.getPersonalEvents();
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('PARSE_ERROR');

      // Ensure data was NOT wiped out
      expect(window.localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS)).toBe('{"corrupted json');
    });

    it('does not overwrite corrupted storage when savePersonalEvent is attempted on malformed data', () => {
      window.localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, '{"corrupted raw user data');

      const event = createTestEvent({
        id: 'evt-safety-test',
        type: 'birthday',
        title: 'Safety Birthday',
      });

      const res = storage.savePersonalEvent(event);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('PARSE_ERROR');

      // Crucial: The corrupted raw string is preserved and not overwritten!
      expect(window.localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS)).toBe('{"corrupted raw user data');
    });

    it('saves and restores preferences round-trip while keeping personal and sample events strictly isolated', () => {
      const personalWithPrefs = createTestEvent({
        preferences: {
          priorities: {
            value: {
              primaryFocus: ['guest_hospitality'],
              atmosphere: 'intimate_traditional',
            },
            provenance: 'confirmed',
            source: 'user_edit',
          },
        },
      });

      storage.savePersonalEvent(personalWithPrefs);
      const retrieved = storage.getPersonalEvent(personalWithPrefs.id);
      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.preferences?.priorities?.value.atmosphere).toBe('intimate_traditional');
      expect(retrieved.data?.preferences?.priorities?.provenance).toBe('confirmed');

      // Sample event isolation check
      const sample = storage.getSampleEvent();
      expect(sample.success).toBe(true);
      expect(sample.data?.id).not.toBe(personalWithPrefs.id);

      // Resetting sample event does not touch personal event or its preferences
      storage.resetSampleEvent();
      const stillThere = storage.getPersonalEvent(personalWithPrefs.id);
      expect(stillThere.success).toBe(true);
      expect(stillThere.data?.preferences?.priorities?.value.atmosphere).toBe('intimate_traditional');
    });

    it('handles QuotaExceededError gracefully', () => {
      const quotaErr = new DOMException('Quota exceeded', 'QuotaExceededError');
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.PERSONAL_EVENTS) {
          throw quotaErr;
        }
      });

      const event = createTestEvent({
        id: 'evt-quota-test',
        type: 'birthday',
        title: 'Test Birthday',
        date: '2026-12-01',
        guestTarget: 20,
        budgetCap: 50000,
      });

      const res = storage.savePersonalEvent(event);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('QUOTA_EXCEEDED');
      expect(res.error?.message).toContain('quota exceeded');

      spy.mockRestore();
    });

    it('rejects stale saves with CONCURRENCY_CONFLICT when expectedUpdatedAt does not match (W3-01)', () => {
      const concurrencyEvent = createTestEvent({ id: 'evt-concurrency-test' });
      // 1. Initial save
      const initialSaveRes = storage.savePersonalEvent(concurrencyEvent);
      expect(initialSaveRes.success).toBe(true);

      const savedSnapshot = storage.getPersonalEvent(concurrencyEvent.id).data!;
      const originalTimestamp = savedSnapshot.updatedAt;

      // 2. Simulate a concurrent background update (e.g. vendor payment recorded in another session)
      const concurrentUpdate: Event = {
        ...savedSnapshot,
        title: 'Concurrent Workspace Edit',
      };
      const concurrentSaveRes = storage.savePersonalEvent(concurrentUpdate);
      expect(concurrentSaveRes.success).toBe(true);

      const latestSnapshot = storage.getPersonalEvent(concurrencyEvent.id).data!;
      expect(latestSnapshot.title).toBe('Concurrent Workspace Edit');
      expect(latestSnapshot.updatedAt).not.toBe(originalTimestamp);

      // 3. Attempt to save using the old snapshot timestamp as expectedUpdatedAt
      const staleSaveAttempt: Event = {
        ...savedSnapshot,
        guestTarget: 999, // Stale edit
      };

      const conflictRes = storage.savePersonalEvent(staleSaveAttempt, {
        expectedUpdatedAt: originalTimestamp,
      });

      expect(conflictRes.success).toBe(false);
      expect(conflictRes.error?.code).toBe('CONCURRENCY_CONFLICT');
      expect(conflictRes.error?.message).toContain('updated in another session');

      // 4. Verify the stored event remains the concurrent update, not overwritten by the stale attempt
      const preserved = storage.getPersonalEvent(concurrencyEvent.id).data!;
      expect(preserved.title).toBe('Concurrent Workspace Edit');
      expect(preserved.guestTarget).toBe(concurrencyEvent.guestTarget); // Unchanged!
    });

    it('accepts save when expectedUpdatedAt matches latest stored event', () => {
      const concurrencyEvent = createTestEvent({ id: 'evt-concurrency-valid' });
      storage.savePersonalEvent(concurrencyEvent);
      const savedSnapshot = storage.getPersonalEvent(concurrencyEvent.id).data!;

      const validSaveRes = storage.savePersonalEvent(
        { ...savedSnapshot, title: 'Updated With Matching Timestamp' },
        { expectedUpdatedAt: savedSnapshot.updatedAt }
      );

      expect(validSaveRes.success).toBe(true);
      const updated = storage.getPersonalEvent(concurrencyEvent.id).data!;
      expect(updated.title).toBe('Updated With Matching Timestamp');
    });

    it('rejects stale sample event save with CONCURRENCY_CONFLICT', () => {
      const freshSample = storage.getSampleEvent().data!;
      const originalTimestamp = freshSample.updatedAt;

      // Concurrent update on sample event
      storage.saveSampleEvent({ ...freshSample, title: 'Concurrent Sample Edit' });

      // Attempt to save sample with old timestamp
      const staleRes = storage.saveSampleEvent(
        { ...freshSample, title: 'Stale Sample Edit' },
        { expectedUpdatedAt: originalTimestamp }
      );

      expect(staleRes.success).toBe(false);
      expect(staleRes.error?.code).toBe('CONCURRENCY_CONFLICT');
      expect(storage.getSampleEvent().data?.title).toBe('Concurrent Sample Edit');
    });

    it('reliably advances concurrency version and rejects stale expectedVersion under frozen wall-clock timestamps', () => {
      vi.useFakeTimers();
      const fixedTime = new Date('2026-10-24T12:00:00.000Z');
      vi.setSystemTime(fixedTime);

      const testEvt = createTestEvent({ id: 'evt-frozen-clock' });

      // 1. The first save succeeds
      const firstSave = storage.savePersonalEvent(testEvt);
      expect(firstSave.success).toBe(true);

      const v1Snapshot = storage.getPersonalEvent(testEvt.id).data!;
      expect(v1Snapshot.version).toBe(1);

      // 2. The successful save advances the concurrency version even when wall clock is identical
      const concurrentUpdate: Event = {
        ...v1Snapshot,
        title: 'Concurrent Workspace Edit Under Same Clock',
      };
      const secondSave = storage.savePersonalEvent(concurrentUpdate, {
        expectedVersion: 1,
      });
      expect(secondSave.success).toBe(true);

      const v2Snapshot = storage.getPersonalEvent(testEvt.id).data!;
      expect(v2Snapshot.version).toBe(2);

      // 3. A second save with the stale version (expectedVersion: 1) is rejected
      const staleSaveAttempt: Event = {
        ...v1Snapshot,
        guestTarget: 999,
      };
      const conflictRes = storage.savePersonalEvent(staleSaveAttempt, {
        expectedVersion: 1,
      });
      expect(conflictRes.success).toBe(false);
      expect(conflictRes.error?.code).toBe('CONCURRENCY_CONFLICT');

      // 4. A save with the current version (expectedVersion: 2) succeeds
      const validSaveAttempt: Event = {
        ...v2Snapshot,
        guestTarget: 450,
      };
      const validRes = storage.savePersonalEvent(validSaveAttempt, {
        expectedVersion: 2,
      });
      expect(validRes.success).toBe(true);

      const v3Snapshot = storage.getPersonalEvent(testEvt.id).data!;
      expect(v3Snapshot.version).toBe(3);
      expect(v3Snapshot.guestTarget).toBe(450);

      vi.useRealTimers();
    });

    it('reads legacy records without version and safely initializes version on update', () => {
      // Directly inject a legacy container without 'version' field into localStorage
      const legacyEvent = createTestEvent({ id: 'evt-legacy-no-version' });
      delete (legacyEvent as unknown as Record<string, unknown>).version;

      const container = {
        schemaVersion: 1,
        payload: [legacyEvent],
        timestamp: '2026-01-01T00:00:00.000Z',
      };
      window.localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, JSON.stringify(container));

      // 5. Existing legacy records remain readable and can be safely updated
      const loadedRes = storage.getPersonalEvent(legacyEvent.id);
      expect(loadedRes.success).toBe(true);
      expect(loadedRes.data).toBeDefined();
      expect(loadedRes.data?.version).toBe(1); // Defaulted safely

      // Update legacy record using expectedVersion: 1
      const updateRes = storage.savePersonalEvent(
        { ...loadedRes.data!, title: 'Migrated from Legacy' },
        { expectedVersion: 1 }
      );
      expect(updateRes.success).toBe(true);

      const updatedSnapshot = storage.getPersonalEvent(legacyEvent.id).data!;
      expect(updatedSnapshot.title).toBe('Migrated from Legacy');
      expect(updatedSnapshot.version).toBe(2);
    });

    it('two tabs load same event; Tab A saves a payment; Tab B attempts stale save; Tab A payment preserved', () => {
      // 1. Tab A and Tab B both load the celebration at Version 1
      const baseEvent = createTestEvent({ id: 'evt-two-tabs-race' });
      const initialSave = storage.savePersonalEvent(baseEvent);
      expect(initialSave.success).toBe(true);

      const tabASnapshot = storage.getPersonalEvent(baseEvent.id).data!;
      const tabBSnapshot = storage.getPersonalEvent(baseEvent.id).data!;
      expect(tabASnapshot.version).toBe(1);
      expect(tabBSnapshot.version).toBe(1);

      // 2. Tab A records a payment / settled expense and saves with expectedVersion: 1
      const paymentExpense = {
        id: 'exp-payment-1',
        categoryId: 'cat-test-1',
        title: 'Catering Advance Deposit',
        estimatedAmount: 50000,
        actualAmount: 50000,
        paymentStatus: 'settled' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const tabAUpdated: Event = {
        ...tabASnapshot,
        expenses: [...(tabASnapshot.expenses || []), paymentExpense],
      };

      const tabASaveRes = storage.savePersonalEvent(tabAUpdated, {
        expectedVersion: tabASnapshot.version,
        expectedUpdatedAt: tabASnapshot.updatedAt,
      });
      expect(tabASaveRes.success).toBe(true);

      // Persisted event is now Version 2 with Tab A's payment
      const storedAfterTabA = storage.getPersonalEvent(baseEvent.id).data!;
      expect(storedAfterTabA.version).toBe(2);
      expect(storedAfterTabA.expenses).toHaveLength(1);
      expect(storedAfterTabA.expenses[0].title).toBe('Catering Advance Deposit');

      // 3. Tab B attempts a stale unrelated edit (e.g. guest target change) using its stale snapshot (version: 1)
      const tabBUpdated: Event = {
        ...tabBSnapshot,
        guestTarget: 999, // Unrelated edit
      };

      const tabBSaveRes = storage.savePersonalEvent(tabBUpdated, {
        expectedVersion: tabBSnapshot.version, // stale version: 1
        expectedUpdatedAt: tabBSnapshot.updatedAt,
      });

      // Storage rejects Tab B's stale save
      expect(tabBSaveRes.success).toBe(false);
      expect(tabBSaveRes.error?.code).toBe('CONCURRENCY_CONFLICT');

      // 4. Tab A's payment remains completely intact and undisturbed in storage
      const finalStored = storage.getPersonalEvent(baseEvent.id).data!;
      expect(finalStored.version).toBe(2);
      expect(finalStored.guestTarget).toBe(baseEvent.guestTarget); // NOT 999!
      expect(finalStored.expenses).toHaveLength(1);
      expect(finalStored.expenses[0].title).toBe('Catering Advance Deposit');
      expect(finalStored.expenses[0].actualAmount).toBe(50000);
    });
  });

  describe('Workspace Tab State & Cascading Deletion', () => {
    it('returns null data (defaulting to overview) when nothing is saved', () => {
      const tabRes = storage.getLastTab('evt-test-1');
      expect(tabRes.success).toBe(true);
      expect(tabRes.data).toBeNull();
    });

    it('saves and retrieves the active tab for an event', () => {
      const saveRes = storage.setLastTab('evt-test-1', 'budget');
      expect(saveRes.success).toBe(true);

      const tabRes = storage.getLastTab('evt-test-1');
      expect(tabRes.success).toBe(true);
      expect(tabRes.data).toBe('budget');
    });

    it('rejects invalid tab values and falls back to null', () => {
      // @ts-expect-error testing runtime validation of invalid tab
      const saveRes = storage.setLastTab('evt-test-1', 'nonexistent_tab');
      expect(saveRes.success).toBe(false);
      expect(saveRes.error?.code).toBe('VALIDATION_FAILED');

      expect(storage.getLastTab('evt-test-1').data).toBeNull();
    });

    it('cascades deletion of last tab and AI conversation when personal event is deleted', () => {
      const event = createTestEvent({ id: 'evt-del-1' });
      storage.savePersonalEvent(event);
      storage.setLastTab(event.id, 'vendors');
      const convKey = getAiConversationStorageKey(event.id);
      window.localStorage.setItem(convKey, JSON.stringify({ schemaVersion: 1, eventId: event.id, messages: [] }));

      expect(storage.getLastTab(event.id).data).toBe('vendors');
      expect(window.localStorage.getItem(convKey)).not.toBeNull();

      const delRes = storage.deletePersonalEvent(event.id);
      expect(delRes.success).toBe(true);

      expect(storage.getLastTab(event.id).data).toBeNull();
      expect(window.localStorage.getItem(convKey)).toBeNull();
    });

    it('cleans up sample tab and conversation when sample is reset', () => {
      storage.setLastTab('sample', 'seating');
      const sampleConvKey = getAiConversationStorageKey('sample');
      window.localStorage.setItem(sampleConvKey, JSON.stringify({ schemaVersion: 1, eventId: 'sample', messages: [] }));

      expect(storage.getLastTab('sample').data).toBe('seating');
      expect(window.localStorage.getItem(sampleConvKey)).not.toBeNull();

      storage.resetSampleEvent();

      expect(storage.getLastTab('sample').data).toBeNull();
      expect(window.localStorage.getItem(sampleConvKey)).toBeNull();
    });
  });
});
