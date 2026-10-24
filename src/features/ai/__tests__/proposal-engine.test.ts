import { describe, expect, it } from 'vitest';
import {
  applyProposalToEvent,
  detectProposalConflicts,
  dismissProposal,
  markProposalAccepted,
} from '../proposal-engine';
import { createFreshSampleEvent } from '../../events/sample-event';
import { StagedProposal } from '../types';

describe('proposal-engine (Deterministic Proposal Dispatcher)', () => {
  const baseEvent = createFreshSampleEvent();

  it('applies a budget adjustment proposal to category allocations without creating expenses', () => {
    const proposal: StagedProposal = {
      id: 'prop-budget-1',
      actionType: 'adjust_budget_allocation',
      title: 'Optimize Decor Budget',
      explanation: 'Reallocate reserve into floral mandap styling.',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Decor & Florals',
        currentAllocated: 450000,
        proposedAllocated: 500000,
        rationale: 'Temple pillar tuberose garlands',
      },
    };

    const initialExpensesCount = baseEvent.expenses.length;
    const res = applyProposalToEvent(baseEvent, proposal);

    expect(res.success).toBe(true);
    const updatedDecor = res.event.categories.find((c) =>
      c.name.toLowerCase().includes('decor')
    );
    expect(updatedDecor?.allocatedAmount).toBe(500000);

    // CRITICAL: Must NOT create or modify expense lines
    expect(res.event.expenses.length).toBe(initialExpensesCount);
  });

  it('rejects budget proposal if target category does not exist in event', () => {
    const proposal: StagedProposal = {
      id: 'prop-budget-missing',
      actionType: 'adjust_budget_allocation',
      title: 'Missing Category',
      explanation: 'Non-existent category',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Astral Laser Show', // Non-existent!
        currentAllocated: 0,
        proposedAllocated: 50000,
        rationale: 'Testing missing category',
      },
    };

    const res = applyProposalToEvent(baseEvent, proposal);
    expect(res.success).toBe(false);
    expect(res.error).toContain('was not found in the budget ledger');
  });

  it('applies a timeline task proposal calculating deterministic date and preserving overrides', () => {
    const proposal: StagedProposal = {
      id: 'prop-task-1',
      actionType: 'add_task',
      title: 'Finalize Nadaswaram Troupe',
      explanation: 'Schedule morning acoustic arrival.',
      status: 'staged',
      payload: {
        actionType: 'add_task',
        title: 'Review Nadaswaram Arrival Time',
        offsetDays: -14,
        priority: 'high',
        description: 'Coordinate gate entry pass at 5:00 AM.',
      },
    };

    const initialTaskCount = baseEvent.tasks.length;
    const res = applyProposalToEvent(baseEvent, proposal);

    expect(res.success).toBe(true);
    expect(res.event.tasks.length).toBe(initialTaskCount + 1);

    const added = res.event.tasks.find((t) => t.title === 'Review Nadaswaram Arrival Time');
    expect(added?.dueDate).toBeDefined();
    expect(added?.priority).toBe('high');
    expect(added?.status).toBe('pending');
  });

  it('applies a milestone proposal with relative offsetDays', () => {
    const proposal: StagedProposal = {
      id: 'prop-ms-1',
      actionType: 'add_milestone',
      title: 'Invitation Print Proofing',
      explanation: 'Review calligraphy cards.',
      status: 'staged',
      payload: {
        actionType: 'add_milestone',
        title: 'Invitation Print Proof Finalized',
        offsetDays: -75,
        description: 'Golden foil imprint proof checked.',
      },
    };

    const initialMsCount = baseEvent.milestones.length;
    const res = applyProposalToEvent(baseEvent, proposal);

    expect(res.success).toBe(true);
    expect(res.event.milestones.length).toBe(initialMsCount + 1);
    const added = res.event.milestones.find((m) => m.title === 'Invitation Print Proof Finalized');
    expect(added?.offsetDays).toBe(-75);
  });

  it('creates vendor checklist task without fabricating vendor records', () => {
    const proposal: StagedProposal = {
      id: 'prop-vendor-1',
      actionType: 'suggest_vendor_followup',
      title: 'Catering Tasting Follow-up',
      explanation: 'Questions to ask the caterer.',
      status: 'staged',
      payload: {
        actionType: 'suggest_vendor_followup',
        vendorCategory: 'Traditional Catering',
        suggestedQuestions: [
          'Can live appam counters run concurrently?',
          'Is pure ghee used for the ceremonial payasam?',
        ],
      },
    };

    const initialVendorsCount = baseEvent.vendors.length;
    const res = applyProposalToEvent(baseEvent, proposal);

    expect(res.success).toBe(true);
    // Vendors directory count must NEVER increase with fabricated vendor contact records
    expect(res.event.vendors.length).toBe(initialVendorsCount);

    const createdTask = res.event.tasks.find((t) => t.title.includes('Vendor Interview & Scope: Traditional Catering'));
    expect(createdTask).toBeDefined();
    expect(createdTask?.description).toContain('pure ghee');
  });

  it('detects conflicts when a staged proposal references a deleted category', () => {
    const proposals: StagedProposal[] = [
      {
        id: 'prop-conflict-1',
        actionType: 'adjust_budget_allocation',
        title: 'Decor adjustment',
        explanation: 'Florals',
        status: 'staged',
        payload: {
          actionType: 'adjust_budget_allocation',
          categoryName: 'Deleted Secret Vault', // Doesn't exist
          currentAllocated: 100000,
          proposedAllocated: 120000,
          rationale: 'Vault',
        },
      },
    ];

    const detected = detectProposalConflicts(baseEvent, proposals);
    expect(detected[0].status).toBe('conflict');
    expect(detected[0].conflictReason).toContain('no longer exists');
  });

  it('marks proposal as dismissed or accepted without mutating unrelated proposals', () => {
    const proposals: StagedProposal[] = [
      {
        id: 'prop-1',
        actionType: 'add_task',
        title: 'Task 1',
        explanation: 'Test',
        status: 'staged',
        payload: { actionType: 'add_task', title: 'Task 1', offsetDays: -1, priority: 'low' },
      },
      {
        id: 'prop-2',
        actionType: 'add_task',
        title: 'Task 2',
        explanation: 'Test',
        status: 'staged',
        payload: { actionType: 'add_task', title: 'Task 2', offsetDays: -2, priority: 'medium' },
      },
    ];

    const dismissed = dismissProposal(proposals, 'prop-1');
    expect(dismissed[0].status).toBe('dismissed');
    expect(dismissed[1].status).toBe('staged');

    const accepted = markProposalAccepted(dismissed, 'prop-2');
    expect(accepted[0].status).toBe('dismissed');
    expect(accepted[1].status).toBe('accepted');
  });

  it('applies a preference proposal deterministically with confirmed provenance without altering financial contracts', () => {
    const proposal: StagedProposal = {
      id: 'prop-pref-1',
      actionType: 'update_preference',
      title: 'Prioritize Wheelchair Accessibility',
      explanation: 'Elderly relatives require barrier-free ramp access and ground floor seating.',
      status: 'staged',
      payload: {
        actionType: 'update_preference',
        category: 'logistics',
        field: 'accessibilityRequirements',
        proposedValue: {
          guestCountFlexibility: 'strict_cap',
          accessibilityRequirements: ['wheelchair_access', 'elderly_friendly_seating'],
          venueTypePreference: 'temple_mandapam',
          timeOfDay: 'morning_auspicious',
        },
        provenance: 'explicit',
        rationale: 'User specifically requested ramp access.',
        userEvidence: 'My grandmother uses a wheelchair.',
      },
    };

    const initialVendors = [...baseEvent.vendors];
    const initialCategories = [...baseEvent.categories];
    const initialExpenses = [...baseEvent.expenses];

    const res = applyProposalToEvent(baseEvent, proposal);
    expect(res.success).toBe(true);
    expect(res.event.preferences?.logistics?.provenance).toBe('confirmed');
    expect(res.event.preferences?.logistics?.value.accessibilityRequirements).toContain('wheelchair_access');

    // CRITICAL: Must NOT alter vendor contracts, categories, or expenses
    expect(res.event.vendors).toEqual(initialVendors);
    expect(res.event.categories).toEqual(initialCategories);
    expect(res.event.expenses).toEqual(initialExpenses);
  });

  it('applies a partial preference field update preserving sibling preference fields and accurate provenance', () => {
    const eventWithFullBudget = {
      ...baseEvent,
      preferences: {
        ...baseEvent.preferences,
        budget: {
          value: {
            spendingPriorities: ['Catering', 'Photography'],
            economizeAreas: ['Invitations'],
            nonNegotiables: ['Mandap'],
            flexibility: 'strict_hard_limit' as const,
          },
          provenance: 'confirmed' as const,
          source: 'user_onboarding' as const,
        },
      },
    };

    const partialProposal: StagedProposal = {
      id: 'prop-pref-partial',
      actionType: 'update_preference',
      title: 'Adjust Budget Flexibility',
      explanation: 'Allow moderate buffer for high-priority items.',
      status: 'staged',
      payload: {
        actionType: 'update_preference',
        category: 'budget',
        field: 'flexibility',
        proposedValue: 'moderate_flexibility',
        provenance: 'inferred',
        rationale: 'Planner expressed willingness to consider upgrades.',
      },
    };

    const res = applyProposalToEvent(eventWithFullBudget, partialProposal);
    expect(res.success).toBe(true);

    const budgetVal = res.event.preferences?.budget?.value;
    expect(budgetVal?.flexibility).toBe('moderate_flexibility');
    // Sibling fields MUST be preserved!
    expect(budgetVal?.spendingPriorities).toEqual(['Catering', 'Photography']);
    expect(budgetVal?.economizeAreas).toEqual(['Invitations']);
    expect(budgetVal?.nonNegotiables).toEqual(['Mandap']);

    // Provenance must be confirmed, source reflects ai_inference
    expect(res.event.preferences?.budget?.provenance).toBe('confirmed');
    expect(res.event.preferences?.budget?.source).toBe('ai_inference');
  });

  it('flags preference conflict when AI proposes flexible budget while user confirmed strict hard limit', () => {
    const eventWithStrictBudget = {
      ...baseEvent,
      preferences: {
        budget: {
          value: {
            spendingPriorities: ['Catering'],
            economizeAreas: ['Decor'],
            nonNegotiables: ['Muhurtham feast'],
            flexibility: 'strict_hard_limit' as const,
          },
          provenance: 'confirmed' as const,
          source: 'user_edit' as const,
        },
      },
    };

    const conflictingProposal: StagedProposal = {
      id: 'prop-pref-conflict',
      actionType: 'update_preference',
      title: 'Make Budget Flexible',
      explanation: 'Allow spending overflow for floral decor.',
      status: 'staged',
      payload: {
        actionType: 'update_preference',
        category: 'budget',
        field: 'flexibility',
        proposedValue: {
          spendingPriorities: ['Catering'],
          economizeAreas: [],
          nonNegotiables: [],
          flexibility: 'flexible_target',
        },
        provenance: 'inferred',
        rationale: 'Inferred flexibility.',
      },
    };

    const checked = detectProposalConflicts(eventWithStrictBudget, [conflictingProposal]);
    expect(checked[0].status).toBe('conflict');
    expect(checked[0].conflictReason).toContain('Budget Flexibility conflict');
  });
});
