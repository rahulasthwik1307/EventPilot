import { describe, expect, it, vi } from 'vitest';
import {
  buildPrompt,
  generateAssistantResponse,
} from '../gemini-provider';
import { AiAssistantRequest } from '../types';

describe('gemini-provider (Server Provider Adapter)', () => {
  const mockRequest: AiAssistantRequest = {
    eventId: 'sample-event-aarav-meera',
    intent: 'budget',
    userPrompt: 'How should we adjust our florals allocation for South Indian decor?',
    context: {
      eventType: 'wedding',
      title: "Aarav & Meera's Vivaha",
      date: '2026-11-20',
      city: 'Bengaluru',
      currency: 'INR',
      budgetCap: 2500000,
      categorySummary: [
        { name: 'Venue & Catering', allocatedAmount: 1125000 },
        { name: 'Decor & Florals', allocatedAmount: 450000 },
      ],
      expectedAttendance: 14,
    },
  };

  it('builds a structured prompt containing allowlisted context and prompt', () => {
    const prompt = buildPrompt(mockRequest);
    expect(prompt).toContain('Intent: budget');
    expect(prompt).toContain('Event Archetype: wedding');
    expect(prompt).toContain('Budget Cap: 2500000');
    expect(prompt).toContain('Decor & Florals: 450000');
    expect(prompt).toContain('Expected Confirmed Attendance: 14 attendees');
    expect(prompt).toContain('How should we adjust our florals allocation');
  });

  it('returns CONFIG_MISSING when GEMINI_API_KEY is absent and no client override is given', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const res = await generateAssistantResponse(mockRequest);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('CONFIG_MISSING');
      expect(res.error?.status).toBe(500);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('parses valid structured response and stages proposals with generated IDs', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            answer: 'Decor allocations can be optimized by adjusting contingency.',
            summary: 'Increase decor allocation by ₹50,000.',
            recommendations: ['Prioritize tuberose and marigold entrance toranam.'],
            proposals: [
              {
                actionType: 'adjust_budget_allocation',
                title: 'Add Floral Headroom',
                explanation: 'Ensures temple pillar mandap garlands.',
                payload: {
                  actionType: 'adjust_budget_allocation',
                  categoryName: 'Decor & Florals',
                  currentAllocated: 450000,
                  proposedAllocated: 500000,
                  rationale: 'Temple pillar garlands',
                },
              },
            ],
          }),
        }),
      },
    } as any;

    const res = await generateAssistantResponse(mockRequest, mockClient);
    expect(res.success).toBe(true);
    expect(res.data?.answer).toContain('Decor allocations can be optimized');
    expect(res.data?.proposals).toHaveLength(1);
    expect(res.data?.proposals[0].id).toMatch(/^prop-\d+-1$/);
    expect(res.data?.proposals[0].status).toBe('staged');
    expect(res.data?.modelUsed).toBe('gemini-3.8-flash');
  });

  it('maps 503 high demand error gracefully to MODEL_UNAVAILABLE status 503', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockRejectedValue(
          new Error('503 Service Unavailable: This model is currently experiencing high demand.')
        ),
      },
    } as any;

    const res = await generateAssistantResponse(mockRequest, mockClient);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('MODEL_UNAVAILABLE');
    expect(res.error?.status).toBe(503);
    expect(res.error?.message).toContain('experiencing high demand');
  });

  it('maps 429 quota error to QUOTA_EXCEEDED status 429', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockRejectedValue(
          new Error('429 RESOURCE_EXHAUSTED: Rate limit exceeded')
        ),
      },
    } as any;

    const res = await generateAssistantResponse(mockRequest, mockClient);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('QUOTA_EXCEEDED');
    expect(res.error?.status).toBe(429);
  });

  it('handles malformed JSON from model with status 502 without throwing', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: 'This is not valid JSON output { broken',
        }),
      },
    } as any;

    const res = await generateAssistantResponse(mockRequest, mockClient);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('INVALID_JSON');
    expect(res.error?.status).toBe(502);
  });
});
