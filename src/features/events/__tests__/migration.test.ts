import { describe, expect, it } from 'vitest';
import { migrateEventToM2, migrateEventToM3 } from '../storage';
import { Event } from '../types';

describe('Storage & Domain Migration - Milestone 1, 2, and 3', () => {
  it('seamlessly upgrades an M1 event with missing M2 and M3 fields', () => {
    // Legacy M1 event without expenses, milestones, tasks, vendors, etc.
    const legacyM1Event = {
      id: 'legacy-event-1',
      type: 'birthday' as const,
      title: 'Kabir 10th Birthday Adventure',
      date: '2026-12-10',
      location: 'Cubbon Park, Bengaluru',
      guestTarget: 40,
      budgetCap: 60000,
      currency: 'INR' as const,
      culturalContext: {
        traditionOrTheme: 'Outdoor Nature & Treasure Hunt',
      },
      categories: [],
      expenses: [],
      milestones: [],
      tasks: [],
      createdAt: '2026-10-20T12:00:00.000Z',
      updatedAt: '2026-10-20T12:00:00.000Z',
    } as unknown as Event;

    const migrated = migrateEventToM3(legacyM1Event);

    // Baseline fields untouched
    expect(migrated.id).toBe('legacy-event-1');
    expect(migrated.title).toBe('Kabir 10th Birthday Adventure');
    expect(migrated.date).toBe('2026-12-10');
    expect(migrated.budgetCap).toBe(60000);

    // M2 starter categories automatically generated matching budgetCap
    expect(migrated.categories).toHaveLength(5);
    const totalAllocated = migrated.categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
    expect(totalAllocated).toBe(60000);

    // M2 starter milestones and tasks generated
    expect(migrated.milestones.length).toBeGreaterThan(0);
    expect(migrated.tasks.length).toBeGreaterThan(0);

    // STRICT GUARD: No artificial expenses, vendors, guests, or tables are fabricated
    expect(migrated.expenses).toHaveLength(0);
    expect(migrated.vendors).toHaveLength(0);
    expect(migrated.households).toHaveLength(0);
    expect(migrated.guests).toHaveLength(0);
    expect(migrated.tables).toHaveLength(0);
    expect(migrated.assignments).toHaveLength(0);
  });

  it('preserves existing M2 data when migrating to M3', () => {
    const existingM2Event = {
      id: 'm2-event',
      type: 'wedding' as const,
      title: 'Priya & Rohan',
      date: '2027-02-14',
      guestTarget: 200,
      budgetCap: 1000000,
      currency: 'INR' as const,
      categories: [{ id: 'custom-cat', name: 'Custom Mandap', allocatedAmount: 500000 }],
      expenses: [
        {
          id: 'exp-1',
          categoryId: 'custom-cat',
          title: 'Mandap deposit',
          estimatedAmount: 200000,
          actualAmount: 100000,
          paymentStatus: 'deposit_paid' as const,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      milestones: [{ id: 'm-custom', title: 'Custom Milestone', offsetDays: -15 }],
      tasks: [
        {
          id: 't-custom',
          title: 'Custom Task',
          priority: 'urgent' as const,
          status: 'completed' as const,
          dueDate: '2027-01-30',
          isDueDateOverridden: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as unknown as Event;

    const migrated = migrateEventToM3(existingM2Event);

    expect(migrated.categories).toEqual(existingM2Event.categories);
    expect(migrated.expenses).toEqual(existingM2Event.expenses);
    expect(migrated.milestones).toEqual(existingM2Event.milestones);
    expect(migrated.tasks).toEqual(existingM2Event.tasks);

    // M3 arrays initialized safely
    expect(migrated.vendors).toEqual([]);
    expect(migrated.households).toEqual([]);
    expect(migrated.guests).toEqual([]);
    expect(migrated.tables).toEqual([]);
    expect(migrated.assignments).toEqual([]);
  });

  it('cleans orphaned seating assignments during migration', () => {
    const eventWithOrphans = {
      id: 'm3-orphans',
      type: 'wedding' as const,
      title: 'Test Orphans',
      date: '2027-05-01',
      guestTarget: 50,
      budgetCap: 100000,
      currency: 'INR' as const,
      categories: [],
      expenses: [],
      milestones: [],
      tasks: [],
      vendors: [],
      households: [],
      guests: [{ id: 'g1', firstName: 'John', rsvpStatus: 'confirmed', invitationStatus: 'sent', plusOneAllowed: false, plusOneExpected: false, createdAt: '', updatedAt: '' }],
      tables: [{ id: 'tbl_1', name: 'Table 1', capacity: 8 }],
      assignments: [
        { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
        { id: 'a2', tableId: 'tbl_ghost', guestId: 'g1', isPlusOne: false, assignedAt: '' }, // Deleted table
        { id: 'a3', tableId: 'tbl_1', guestId: 'g_ghost', isPlusOne: false, assignedAt: '' }, // Deleted guest
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as unknown as Event;

    const migrated = migrateEventToM3(eventWithOrphans);
    expect(migrated.assignments).toHaveLength(1);
    expect(migrated.assignments[0].id).toBe('a1');
  });
});
