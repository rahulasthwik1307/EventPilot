import { describe, expect, it } from 'vitest';
import { migrateEventToM2 } from '../storage';
import { Event } from '../types';

describe('Storage & Domain Migration - Milestone 1 to Milestone 2', () => {
  it('seamlessly upgrades an M1 event with missing M2 fields', () => {
    // M1 event without expenses, milestones, or tasks
    const legacyM1Event: Event = {
      id: 'legacy-event-1',
      type: 'birthday',
      title: 'Kabir 10th Birthday Adventure',
      date: '2026-12-10',
      location: 'Cubbon Park, Bengaluru',
      guestTarget: 40,
      budgetCap: 60000,
      currency: 'INR',
      culturalContext: {
        traditionOrTheme: 'Outdoor Nature & Treasure Hunt',
      },
      categories: [],
      expenses: [],
      milestones: [],
      tasks: [],
      createdAt: '2026-10-20T12:00:00.000Z',
      updatedAt: '2026-10-20T12:00:00.000Z',
    };

    const migrated = migrateEventToM2(legacyM1Event);

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

    // STRICT GUARD: No artificial expenses are fabricated
    expect(migrated.expenses).toHaveLength(0);
  });

  it('preserves existing M2 data when migrating already-configured events', () => {
    const existingM2Event: Event = {
      id: 'm2-event',
      type: 'wedding',
      title: 'Priya & Rohan',
      date: '2027-02-14',
      guestTarget: 200,
      budgetCap: 1000000,
      currency: 'INR',
      categories: [{ id: 'custom-cat', name: 'Custom Mandap', allocatedAmount: 500000 }],
      expenses: [
        {
          id: 'exp-1',
          categoryId: 'custom-cat',
          title: 'Mandap deposit',
          estimatedAmount: 200000,
          actualAmount: 100000,
          paymentStatus: 'deposit_paid',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      milestones: [{ id: 'm-custom', title: 'Custom Milestone', offsetDays: -15 }],
      tasks: [
        {
          id: 't-custom',
          title: 'Custom Task',
          priority: 'urgent',
          status: 'completed',
          dueDate: '2027-01-30',
          isDueDateOverridden: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const migrated = migrateEventToM2(existingM2Event);

    expect(migrated.categories).toEqual(existingM2Event.categories);
    expect(migrated.expenses).toEqual(existingM2Event.expenses);
    expect(migrated.milestones).toEqual(existingM2Event.milestones);
    expect(migrated.tasks).toEqual(existingM2Event.tasks);
  });
});
