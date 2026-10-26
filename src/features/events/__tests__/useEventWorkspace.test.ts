import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useEventWorkspace } from '../useEventWorkspace';
import { eventStorage } from '../storage';
import { createFreshSampleEvent } from '../sample-event';

describe('useEventWorkspace hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads sample event when given sample id', () => {
    const { result } = renderHook(() => useEventWorkspace('sample'));

    expect(result.current.event).not.toBeNull();
    expect(result.current.event?.isSample).toBe(true);
    expect(result.current.notFound).toBe(false);
  });

  it('loads personal event by id from storage', () => {
    const sample = createFreshSampleEvent();
    const personalEvent = {
      ...sample,
      id: 'evt_test_personal_1',
      isSample: false,
      title: 'Personal Vivaha',
    };
    eventStorage.savePersonalEvent(personalEvent);

    const { result } = renderHook(() => useEventWorkspace('evt_test_personal_1'));

    expect(result.current.event).not.toBeNull();
    expect(result.current.event?.id).toBe('evt_test_personal_1');
    expect(result.current.event?.title).toBe('Personal Vivaha');
  });

  it('flags notFound when personal event does not exist in storage', () => {
    const { result } = renderHook(() => useEventWorkspace('non_existent_id'));

    expect(result.current.event).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it('updates personal event with monotonic version increment', () => {
    const sample = createFreshSampleEvent();
    const personalEvent = {
      ...sample,
      id: 'evt_update_test',
      isSample: false,
      title: 'Original Title',
      version: 1,
    };
    eventStorage.savePersonalEvent(personalEvent);

    const { result } = renderHook(() => useEventWorkspace('evt_update_test'));

    expect(result.current.event?.title).toBe('Original Title');

    act(() => {
      if (result.current.event) {
        result.current.updateEvent({
          ...result.current.event,
          title: 'Updated Title',
        });
      }
    });

    expect(result.current.event?.title).toBe('Updated Title');
    expect(result.current.event?.version).toBe(2);
  });

  it('detects concurrency conflict when saving with stale version', () => {
    const sample = createFreshSampleEvent();
    const personalEvent = {
      ...sample,
      id: 'evt_conflict_test',
      isSample: false,
      version: 1,
    };
    eventStorage.savePersonalEvent(personalEvent);

    const { result } = renderHook(() => useEventWorkspace('evt_conflict_test'));

    // Simulate another tab/session saving version 2 directly to storage
    const stored = eventStorage.getPersonalEvent('evt_conflict_test').data!;
    eventStorage.savePersonalEvent(
      { ...stored, title: 'Mutated in another session' },
      { expectedVersion: 1 }
    );

    // Now try to save through hook with original active snapshot (version 1)
    act(() => {
      if (result.current.event) {
        result.current.updateEvent({
          ...result.current.event,
          title: 'Should be rejected',
        });
      }
    });

    expect(result.current.concurrencyConflict).not.toBeNull();
    expect(result.current.event?.title).not.toBe('Should be rejected');
  });

  it('resets sample event when resetSample is invoked', () => {
    const { result } = renderHook(() => useEventWorkspace('sample'));

    act(() => {
      if (result.current.event) {
        result.current.updateEvent({
          ...result.current.event,
          title: 'Modified Sample',
        });
      }
    });

    expect(result.current.event?.title).toBe('Modified Sample');

    act(() => {
      result.current.resetSample();
    });

    expect(result.current.event?.title).toContain('Aarav & Meera');
  });

  it('deletes personal event successfully', () => {
    const sample = createFreshSampleEvent();
    const personalEvent = {
      ...sample,
      id: 'evt_to_delete',
      isSample: false,
    };
    eventStorage.savePersonalEvent(personalEvent);

    const { result } = renderHook(() => useEventWorkspace('evt_to_delete'));

    let deleted = false;
    act(() => {
      deleted = result.current.deleteEvent();
    });

    expect(deleted).toBe(true);
    const check = eventStorage.getPersonalEvent('evt_to_delete');
    expect(check.data).toBeNull();
  });

  it('handles corrupted storage JSON gracefully by exposing storageError without crashing or overwriting data', () => {
    window.localStorage.setItem('event_pilot_personal_events_v1', 'corrupted-{{json');
    window.localStorage.setItem('unrelated_key', 'preserved_data');

    const { result } = renderHook(() => useEventWorkspace('evt_any_id'));

    expect(result.current.event).toBeNull();
    expect(result.current.notFound).toBe(false);
    expect(result.current.storageError).toBe(
      'Saved personal event data is corrupted and cannot be parsed.'
    );

    // Attempting an update when storage is corrupted should safely fail without throwing
    const sample = createFreshSampleEvent();
    expect(() => {
      act(() => {
        result.current.updateEvent(sample);
      });
    }).not.toThrow();

    // Unrelated storage keys must remain intact
    expect(window.localStorage.getItem('unrelated_key')).toBe('preserved_data');
  });
});
