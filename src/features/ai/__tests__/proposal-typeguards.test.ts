import { describe, expect, it } from 'vitest';
import { isDiscriminatedProposal } from '../proposal-engine';
import { ProposalActionType, StagedProposal } from '../types';

describe('proposal-engine type guard: isDiscriminatedProposal', () => {
  it('returns true and narrows for an adjust_budget_allocation proposal', () => {
    const proposal: StagedProposal = {
      id: 'prop-1',
      actionType: 'adjust_budget_allocation',
      title: 'Optimize Decor',
      explanation: 'Reallocate reserve into floral mandap',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Decor & Florals',
        currentAllocated: 450000,
        proposedAllocated: 500000,
        rationale: 'Mandap marigolds',
      },
    };

    expect(isDiscriminatedProposal(proposal)).toBe(true);
    if (isDiscriminatedProposal(proposal)) {
      expect(proposal.actionType).toBe('adjust_budget_allocation');
      if (proposal.actionType === 'adjust_budget_allocation') {
        expect(proposal.payload.categoryName).toBe('Decor & Florals');
        expect(proposal.payload.proposedAllocated).toBe(500000);
      }
    }
  });

  it('returns true and narrows for an add_task proposal', () => {
    const proposal: StagedProposal = {
      id: 'prop-2',
      actionType: 'add_task',
      title: 'Book Mandap Florist',
      explanation: 'Secure vendor for auspicious setup',
      status: 'staged',
      payload: {
        actionType: 'add_task',
        title: 'Confirm floral order',
        offsetDays: -14,
        priority: 'high',
        description: 'Traditional tuberose garlands',
      },
    };

    expect(isDiscriminatedProposal(proposal)).toBe(true);
    if (isDiscriminatedProposal(proposal)) {
      expect(proposal.actionType).toBe('add_task');
      if (proposal.actionType === 'add_task') {
        expect(proposal.payload.title).toBe('Confirm floral order');
        expect(proposal.payload.priority).toBe('high');
        expect(proposal.payload.offsetDays).toBe(-14);
      }
    }
  });

  it('returns true and narrows for an add_milestone proposal', () => {
    const proposal: StagedProposal = {
      id: 'prop-3',
      actionType: 'add_milestone',
      title: '1 Month Prior Milestone',
      explanation: 'Finalize attendee numbers and RSVPs',
      status: 'staged',
      payload: {
        actionType: 'add_milestone',
        title: 'RSVP Cutoff',
        offsetDays: -30,
      },
    };

    expect(isDiscriminatedProposal(proposal)).toBe(true);
    if (isDiscriminatedProposal(proposal)) {
      expect(proposal.actionType).toBe('add_milestone');
      if (proposal.actionType === 'add_milestone') {
        expect(proposal.payload.offsetDays).toBe(-30);
      }
    }
  });

  it('returns true and narrows for an add_checklist_item proposal', () => {
    const proposal: StagedProposal = {
      id: 'prop-4',
      actionType: 'add_checklist_item',
      title: 'Prepare Welcome Hampers',
      explanation: 'Traditional dry fruit boxes for outstation guests',
      status: 'staged',
      payload: {
        actionType: 'add_checklist_item',
        area: 'logistics',
        itemText: 'Order Mithai Hampers',
      },
    };

    expect(isDiscriminatedProposal(proposal)).toBe(true);
    if (isDiscriminatedProposal(proposal)) {
      expect(proposal.actionType).toBe('add_checklist_item');
      if (proposal.actionType === 'add_checklist_item') {
        expect(proposal.payload.itemText).toBe('Order Mithai Hampers');
        expect(proposal.payload.area).toBe('logistics');
      }
    }
  });

  it('returns true and narrows for a suggest_vendor_followup proposal', () => {
    const proposal: StagedProposal = {
      id: 'prop-5',
      actionType: 'suggest_vendor_followup',
      title: 'Follow up with Caterer',
      explanation: 'Confirm tasting session date',
      status: 'staged',
      payload: {
        actionType: 'suggest_vendor_followup',
        vendorCategory: 'catering',
        suggestedQuestions: ['Discuss Jain options for family elders'],
      },
    };

    expect(isDiscriminatedProposal(proposal)).toBe(true);
    if (isDiscriminatedProposal(proposal)) {
      expect(proposal.actionType).toBe('suggest_vendor_followup');
      if (proposal.actionType === 'suggest_vendor_followup') {
        expect(proposal.payload.vendorCategory).toBe('catering');
        expect(proposal.payload.suggestedQuestions).toHaveLength(1);
      }
    }
  });

  it('returns true and narrows for an update_preference proposal', () => {
    const proposal: StagedProposal = {
      id: 'prop-6',
      actionType: 'update_preference',
      title: 'Record Dietary Preference',
      explanation: 'Mark pure vegetarian catering requirement',
      status: 'staged',
      payload: {
        actionType: 'update_preference',
        category: 'budget',
        field: 'dietaryStyle',
        proposedValue: 'pure_vegetarian',
        provenance: 'explicit',
        rationale: 'Requested during family consultation',
      },
    };

    expect(isDiscriminatedProposal(proposal)).toBe(true);
    if (isDiscriminatedProposal(proposal)) {
      expect(proposal.actionType).toBe('update_preference');
      if (proposal.actionType === 'update_preference') {
        expect(proposal.payload.category).toBe('budget');
        expect(proposal.payload.field).toBe('dietaryStyle');
        expect(proposal.payload.proposedValue).toBe('pure_vegetarian');
      }
    }
  });

  it('returns false for unknown or invalid action types', () => {
    const unknownActionProposal: StagedProposal = {
      id: 'prop-invalid',
      actionType: 'unknown_custom_action' as unknown as ProposalActionType,
      title: 'Invalid Action Proposal',
      explanation: 'Unrecognized action',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Decor',
        currentAllocated: 100,
        proposedAllocated: 200,
        rationale: 'Test',
      },
    };

    expect(isDiscriminatedProposal(unknownActionProposal)).toBe(false);

    const emptyActionProposal: StagedProposal = {
      id: 'prop-empty',
      actionType: '' as unknown as ProposalActionType,
      title: 'Empty Action',
      explanation: 'Empty',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Decor',
        currentAllocated: 100,
        proposedAllocated: 200,
        rationale: 'Test',
      },
    };

    expect(isDiscriminatedProposal(emptyActionProposal)).toBe(false);
  });
});
