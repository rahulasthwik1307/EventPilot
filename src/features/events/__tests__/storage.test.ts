import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageEventStorage, STORAGE_KEYS } from '../storage';
import { Event } from '../types';

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
  });
});
