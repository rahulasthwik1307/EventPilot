import { describe, expect, it } from 'vitest';
import {
  applyReplanningProposals,
  generateReplanningPlan,
  validateSelectedProposals,
} from '../replanning-engine';
import { Event } from '../../events/types';

describe('replanning-engine (Deterministic Replanning & Impact System)', () => {
  const baseEvent: Event = {
    id: 'test-event-replan',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1200000,
    currency: 'INR',
    categories: [
      { id: 'cat-venue', name: 'Venue & Heritage Ambiance', allocatedAmount: 500000 },
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 400000 },
      { id: 'cat-decor', name: 'Decor & Florals', allocatedAmount: 200000 },
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 100000 },
    ],
    expenses: [
      {
        id: 'exp-venue',
        categoryId: 'cat-venue',
        title: 'Courtyard Palace Rental',
        estimatedAmount: 450000,
        actualAmount: 450000,
        costModel: 'fixed',
        paymentStatus: 'settled',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-catering',
        categoryId: 'cat-catering',
        title: 'Banana Leaf Sadya Feast',
        estimatedAmount: 300000,
        unitCost: 1500, // 200 * 1500 = 300,000
        costModel: 'per_guest',
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-decor',
        categoryId: 'cat-decor',
        title: 'Mandap Floral Setup',
        estimatedAmount: 160000,
        actualAmount: 90000,
        costModel: 'fixed',
        paymentStatus: 'deposit_paid',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-photo',
        categoryId: 'cat-photo',
        title: 'Candid Photography',
        estimatedAmount: 90000,
        costModel: 'fixed',
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    milestones: [
      {
        id: 'ms-6m',
        title: '6 Months Prior',
        offsetDays: -180,
      },
      {
        id: 'ms-1m',
        title: '1 Month Prior',
        offsetDays: -30,
      },
    ],
    tasks: [
      {
        id: 'task-venue-book',
        milestoneId: 'ms-6m',
        title: 'Confirm Courtyard Palace Booking',
        dueDate: '2026-05-24', // 180 days prior to 2026-11-20
        priority: 'high',
        status: 'completed',
        isDueDateOverridden: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'task-catering-tasting',
        milestoneId: 'ms-1m',
        title: 'Schedule Sadya Tasting Session',
        dueDate: '2026-10-21', // 30 days prior to 2026-11-20
        priority: 'medium',
        status: 'pending',
        isDueDateOverridden: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'task-custom-manual',
        milestoneId: 'ms-1m',
        title: 'Special Family Jewelry Consultation',
        dueDate: '2026-08-15', // Manually set date
        priority: 'high',
        status: 'pending',
        isDueDateOverridden: true, // Manual override!
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    vendors: [
      {
        id: 'vnd-venue',
        name: 'Courtyard Palace',
        category: 'venue',
        status: 'booked',
        quotedCost: 450000,
        agreedCost: 450000,
        depositPaid: 200000,
        amountPaid: 450000,
        linkedCategoryId: 'cat-venue',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'vnd-photo',
        name: 'Vivaha Lens',
        category: 'photography',
        status: 'booked',
        quotedCost: 90000,
        agreedCost: 90000,
        depositPaid: 25000,
        amountPaid: 25000,
        linkedCategoryId: 'cat-photo',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    tables: [
      { id: 'tbl-1', name: 'Family Table 1', capacity: 10 },
      { id: 'tbl-2', name: 'Family Table 2', capacity: 10 },
    ],
    households: [],
    guests: [],
    assignments: [],
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
  };

  it('generates date shift proposals with dependent task shifts while strictly preserving overrides and completed tasks', () => {
    // Postpone wedding date by 30 days: 2026-11-20 -> 2026-12-20
    const plan = generateReplanningPlan(baseEvent, { candidateDate: '2026-12-20' });

    expect(plan.impact.triggers).toContain('date_change');
    expect(plan.impact.scheduling.calendarDateShiftDays).toBe(30);

    // Date proposal exists
    const dateProp = plan.proposals.find((p) => p.id === 'prop-date-shift');
    expect(dateProp).toBeDefined();
    expect(dateProp?.proposedValue).toBe('2026-12-20');

    // Task tasting (pending, not overridden) must be rescheduled with dependency on prop-date-shift
    const tastingTaskProp = plan.proposals.find((p) => p.id === 'prop-task-task-catering-tasting');
    expect(tastingTaskProp).toBeDefined();
    expect(tastingTaskProp?.proposedValue).toBe('2026-11-20'); // 30 days prior to 2026-12-20
    expect(tastingTaskProp?.dependsOnProposalIds).toEqual(['prop-date-shift']);

    // Completed task (task-venue-book) must NOT be proposed for rescheduling
    const completedTaskProp = plan.proposals.find((p) => p.id === 'prop-task-task-venue-book');
    expect(completedTaskProp).toBeUndefined();
    expect(plan.impact.scheduling.preservedCompletedTasksCount).toBe(1);

    // Overridden task (task-custom-manual) must NOT be proposed for rescheduling
    const overriddenTaskProp = plan.proposals.find((p) => p.id === 'prop-task-task-custom-manual');
    expect(overriddenTaskProp).toBeUndefined();
    expect(plan.impact.scheduling.preservedManualOverridesCount).toBe(1);
  });

  it('generates guest count scaling proposals and variable catering shifts with dependency', () => {
    // Increase guests from 200 to 250 (+50 guests)
    const plan = generateReplanningPlan(baseEvent, { candidateGuestTarget: 250 });

    expect(plan.impact.triggers).toContain('guest_target_change');
    expect(plan.impact.attendance.guestDelta).toBe(50);

    const guestProp = plan.proposals.find((p) => p.id === 'prop-guest-target');
    expect(guestProp).toBeDefined();
    expect(guestProp?.proposedValue).toBe(250);

    // Variable catering expense must scale: 250 * 1500 = 375,000 (was 300,000)
    const cateringProp = plan.proposals.find((p) => p.id === 'prop-exp-variable-exp-catering');
    expect(cateringProp).toBeDefined();
    expect(cateringProp?.proposedValue).toBe(375000);
    expect(cateringProp?.dependsOnProposalIds).toEqual(['prop-guest-target']);

    // Fixed decor/venue expenses must NOT be scaled
    expect(plan.proposals.find((p) => p.id.includes('exp-venue'))).toBeUndefined();
    expect(plan.proposals.find((p) => p.id.includes('exp-decor'))).toBeUndefined();

    // Table seating pressure should be flagged (250 guests vs 20 capacity)
    expect(plan.impact.attendance.isCapacityExceeded).toBe(true);
    expect(plan.impact.attendance.capacityShortfall).toBe(230);
  });

  it('generates category allocation rebalance proposals', () => {
    const plan = generateReplanningPlan(baseEvent, {
      candidateCategoryAllocations: {
        'cat-catering': 450000, // increased from 400k
        'cat-decor': 150000, // decreased from 200k
      },
    });

    expect(plan.impact.triggers).toContain('category_allocation_change');

    const cateringAllocProp = plan.proposals.find((p) => p.id === 'prop-alloc-cat-catering');
    expect(cateringAllocProp).toBeDefined();
    expect(cateringAllocProp?.proposedValue).toBe(450000);

    const decorAllocProp = plan.proposals.find((p) => p.id === 'prop-alloc-cat-decor');
    expect(decorAllocProp).toBeDefined();
    expect(decorAllocProp?.proposedValue).toBe(150000);
  });

  it('rejects partial selection when a prerequisite dependency is unselected', () => {
    const plan = generateReplanningPlan(baseEvent, {
      candidateDate: '2026-12-20',
      candidateGuestTarget: 250,
    });

    // Try to select task shift without selecting the parent date shift
    const validation = validateSelectedProposals(baseEvent, plan.proposals, [
      'prop-task-task-catering-tasting',
    ]);

    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toContain('cannot be applied without prerequisite');

    // Try to select catering scaling without selecting guest target change
    const val2 = validateSelectedProposals(baseEvent, plan.proposals, [
      'prop-exp-variable-exp-catering',
    ]);
    expect(val2.isValid).toBe(false);
    expect(val2.errors[0]).toContain('cannot be applied without prerequisite');

    // Selecting both parent and dependent proposal passes
    const val3 = validateSelectedProposals(baseEvent, plan.proposals, [
      'prop-date-shift',
      'prop-task-task-catering-tasting',
    ]);
    expect(val3.isValid).toBe(true);
  });

  it('detects concurrency conflict when event snapshot timestamp has changed', () => {
    const plan = generateReplanningPlan(baseEvent, { candidateDate: '2026-12-20' });

    // Simulate concurrent workspace update (e.g. updatedAt changed in another session)
    const modifiedEvent: Event = {
      ...baseEvent,
      updatedAt: '2026-10-24T09:00:00.000Z',
    };

    const validation = validateSelectedProposals(modifiedEvent, plan.proposals, ['prop-date-shift']);
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toContain('modified in another session');

    // applyReplanningProposals returns CONCURRENCY_CONFLICT
    const applyRes = applyReplanningProposals(modifiedEvent, plan.proposals, ['prop-date-shift']);
    expect(applyRes.success).toBe(false);
    expect(applyRes.code).toBe('CONCURRENCY_CONFLICT');
  });

  it('applies selected proposals safely and recalculates dependent timeline and financial state', () => {
    const plan = generateReplanningPlan(baseEvent, {
      candidateDate: '2026-12-20',
      candidateGuestTarget: 250,
      candidateBudgetCap: 1500000,
    });

    const selectedIds = [
      'prop-date-shift',
      'prop-task-task-catering-tasting',
      'prop-guest-target',
      'prop-exp-variable-exp-catering',
      'prop-budget-cap',
    ];

    const applyRes = applyReplanningProposals(baseEvent, plan.proposals, selectedIds);
    expect(applyRes.success).toBe(true);

    const updated = applyRes.event;
    expect(updated.date).toBe('2026-12-20');
    expect(updated.guestTarget).toBe(250);
    expect(updated.budgetCap).toBe(1500000);

    // Tasting task was updated to new date
    const updatedTasting = updated.tasks.find((t) => t.id === 'task-catering-tasting');
    expect(updatedTasting?.dueDate).toBe('2026-11-20');

    // Completed and overridden tasks were preserved
    const completedTask = updated.tasks.find((t) => t.id === 'task-venue-book');
    expect(completedTask?.dueDate).toBe('2026-05-24');
    expect(completedTask?.status).toBe('completed');

    const overriddenTask = updated.tasks.find((t) => t.id === 'task-custom-manual');
    expect(overriddenTask?.dueDate).toBe('2026-08-15');
    expect(overriddenTask?.isDueDateOverridden).toBe(true);

    // Variable catering expense was scaled
    const cateringExp = updated.expenses.find((e) => e.id === 'exp-catering');
    expect(cateringExp?.estimatedAmount).toBe(375000);

    // Fixed venue and decor expenses were completely preserved
    const venueExp = updated.expenses.find((e) => e.id === 'exp-venue');
    expect(venueExp?.estimatedAmount).toBe(450000);
    expect(venueExp?.actualAmount).toBe(450000);
  });

  it('incorporates selected trade-off options into proposals respecting contract locks and actual spend floors', () => {
    // Generate plan with candidateBudgetCap causing a shortfall
    const initialPlan = generateReplanningPlan(baseEvent, { candidateBudgetCap: 900000 });
    expect(initialPlan.tradeOffOptions.length).toBeGreaterThan(0);

    const decorTradeOff = initialPlan.tradeOffOptions.find((o) => o.targetExpenseId === 'exp-decor');
    expect(decorTradeOff).toBeDefined();

    // Re-generate plan passing the selected trade-off ID
    const planWithSelectedTradeOff = generateReplanningPlan(baseEvent, {
      candidateBudgetCap: 900000,
      selectedTradeOffIds: [decorTradeOff!.id],
    });

    const tradeOffProp = planWithSelectedTradeOff.proposals.find(
      (p) => p.id === `prop-tradeoff-${decorTradeOff!.id}`
    );
    expect(tradeOffProp).toBeDefined();
    // In baseEvent, decor expense has actualAmount: 90,000. Proposed amount must be >= 90,000!
    expect(Number(tradeOffProp!.proposedValue)).toBeGreaterThanOrEqual(90000);

    // Contracted photography expense (90k agreed contract) must NOT have trade-off proposals cutting it
    const photoCut = planWithSelectedTradeOff.proposals.find((p) => p.id.includes('exp-photo'));
    expect(photoCut).toBeUndefined();
  });

  it('fails validation when target entity was deleted concurrently', () => {
    const plan = generateReplanningPlan(baseEvent, {
      candidateCategoryAllocations: { 'cat-decor': 150000 },
    });

    const eventWithDeletedCategory: Event = {
      ...baseEvent,
      categories: baseEvent.categories.filter((c) => c.id !== 'cat-decor'),
    };

    const validation = validateSelectedProposals(
      eventWithDeletedCategory,
      plan.proposals,
      ['prop-alloc-cat-decor']
    );
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toContain('no longer exists');
  });

  it('never mutates the input event object during plan generation or validation', () => {
    const originalEventStr = JSON.stringify(baseEvent);

    const plan = generateReplanningPlan(baseEvent, {
      candidateDate: '2026-12-25',
      candidateGuestTarget: 350,
      candidateBudgetCap: 2000000,
    });
    validateSelectedProposals(baseEvent, plan.proposals, ['prop-date-shift']);

    expect(JSON.stringify(baseEvent)).toBe(originalEventStr);
  });
});
