import { describe, expect, it } from 'vitest';
import {
  AiAssistantRequestSchema,
  AiAssistantResponseSchema,
  StagedProposalSchema,
} from '../schemas';

describe('schemas (Zod Request and Proposal Validation)', () => {
  const validContext = {
    eventType: 'wedding' as const,
    title: "Aarav & Meera's Vivaha",
    date: '2026-11-20',
    city: 'Bengaluru',
    currency: 'INR' as const,
    budgetCap: 2500000,
  };

  it('validates a correct AI assistant request payload', () => {
    const valid = {
      eventId: 'evt-123',
      intent: 'budget',
      userPrompt: 'How can we optimize catering allocations?',
      context: validContext,
    };

    const res = AiAssistantRequestSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects empty prompts and prompts exceeding 1000 characters', () => {
    const emptyPrompt = {
      eventId: 'evt-123',
      intent: 'ideas',
      userPrompt: '',
      context: validContext,
    };
    expect(AiAssistantRequestSchema.safeParse(emptyPrompt).success).toBe(false);

    const longPrompt = {
      eventId: 'evt-123',
      intent: 'ideas',
      userPrompt: 'a'.repeat(1001),
      context: validContext,
    };
    expect(AiAssistantRequestSchema.safeParse(longPrompt).success).toBe(false);
  });

  it('validates a budget adjustment proposal correctly', () => {
    const proposal = {
      id: 'prop-1',
      actionType: 'adjust_budget_allocation',
      title: 'Increase Decor Allocation',
      explanation: 'Traditional floral mandap requires additional budget headroom.',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Decor & Florals',
        currentAllocated: 450000,
        proposedAllocated: 550000,
        rationale: 'Temple pillar tuberose garlands',
      },
    };

    const res = StagedProposalSchema.safeParse(proposal);
    expect(res.success).toBe(true);
  });

  it('rejects budget adjustment with negative allocation amount', () => {
    const invalidProposal = {
      id: 'prop-1',
      actionType: 'adjust_budget_allocation',
      title: 'Invalid Negative Budget',
      explanation: 'Error test',
      status: 'staged',
      payload: {
        actionType: 'adjust_budget_allocation',
        categoryName: 'Decor',
        currentAllocated: 450000,
        proposedAllocated: -100, // Invalid!
        rationale: 'Invalid negative test',
      },
    };

    expect(StagedProposalSchema.safeParse(invalidProposal).success).toBe(false);
  });

  it('validates a timeline task proposal with offsetDays and priority', () => {
    const taskProposal = {
      id: 'prop-2',
      actionType: 'add_task',
      title: 'Finalize Nadaswaram Troupe',
      explanation: 'Live acoustic music timing needed for morning Muhurtham.',
      status: 'staged',
      payload: {
        actionType: 'add_task',
        title: 'Finalize Nadaswaram & Thavil timing',
        offsetDays: -30,
        priority: 'high',
        description: 'Coordinate morning arrival time at 5:30 AM.',
      },
    };

    const res = StagedProposalSchema.safeParse(taskProposal);
    expect(res.success).toBe(true);
  });

  it('validates a complete structured response containing proposals and recommendations', () => {
    const fullResponse = {
      answer: 'Here are three actionable improvements for your celebration budget and timeline.',
      summary: 'Reallocated ₹1,00,000 from transit contingency to florals.',
      recommendations: [
        'Book traditional floral artisans 60 days ahead.',
        'Reserve morning acoustic rehearsal.',
      ],
      proposals: [
        {
          id: 'prop-1',
          actionType: 'adjust_budget_allocation',
          title: 'Shift Contingency to Florals',
          explanation: 'Accommodates South Indian temple pillar decor.',
          status: 'staged',
          payload: {
            actionType: 'adjust_budget_allocation',
            categoryName: 'Decor & Florals',
            currentAllocated: 450000,
            proposedAllocated: 550000,
            rationale: 'Mandap entrance toranam',
          },
        },
      ],
      modelUsed: 'gemini-3.8-flash',
      timestamp: '2026-10-21T17:00:00.000Z',
    };

    const res = AiAssistantResponseSchema.safeParse(fullResponse);
    expect(res.success).toBe(true);
  });

  describe('UpdatePreferencePayloadSchema Runtime Precision', () => {
    it('validates a correct update_preference proposal payload', () => {
      const validPrefProposal = {
        id: 'prop-pref-1',
        actionType: 'update_preference',
        title: 'Adjust Budget Flexibility',
        explanation: 'Allow moderate buffer',
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

      const res = StagedProposalSchema.safeParse(validPrefProposal);
      expect(res.success).toBe(true);
    });

    it('rejects update_preference with invalid enum value for flexibility', () => {
      const invalidPref = {
        id: 'prop-pref-err-1',
        actionType: 'update_preference',
        title: 'Invalid',
        explanation: 'Error',
        status: 'staged',
        payload: {
          actionType: 'update_preference',
          category: 'budget',
          field: 'flexibility',
          proposedValue: 'unlimited_money_glitch', // Invalid enum!
          provenance: 'inferred',
          rationale: 'Invalid',
        },
      };

      const res = StagedProposalSchema.safeParse(invalidPref);
      expect(res.success).toBe(false);
    });

    it('rejects update_preference with unsupported category or field', () => {
      const invalidField = {
        id: 'prop-pref-err-2',
        actionType: 'update_preference',
        title: 'Invalid Field',
        explanation: 'Error',
        status: 'staged',
        payload: {
          actionType: 'update_preference',
          category: 'budget',
          field: 'secretCryptoAddress', // Invalid field!
          proposedValue: '0x123',
          provenance: 'inferred',
          rationale: 'Invalid',
        },
      };

      const res = StagedProposalSchema.safeParse(invalidField);
      expect(res.success).toBe(false);
    });

    it('rejects model attempt to inject internal provenance or source metadata', () => {
      const untrustedPayload = {
        id: 'prop-pref-err-3',
        actionType: 'update_preference',
        title: 'Sneaky Model Injection',
        explanation: 'Error',
        status: 'staged',
        payload: {
          actionType: 'update_preference',
          category: 'budget',
          field: 'flexibility',
          proposedValue: {
            flexibility: 'moderate_flexibility',
            provenance: 'confirmed', // Attempted forged confirmation!
            source: 'user_onboarding',
          },
          provenance: 'inferred',
          rationale: 'Testing forged metadata',
        },
      };

      const res = StagedProposalSchema.safeParse(untrustedPayload);
      expect(res.success).toBe(false);
    });
  });
});
