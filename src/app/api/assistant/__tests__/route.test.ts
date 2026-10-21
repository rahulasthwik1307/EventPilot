import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as provider from '../../../../features/ai/gemini-provider';

describe('POST /api/assistant (App Router API Route)', () => {
  const validPayload = {
    eventId: 'sample-event-aarav-meera',
    intent: 'budget',
    userPrompt: 'How can we optimize our budget?',
    context: {
      eventType: 'wedding',
      title: "Aarav & Meera's Vivaha",
      date: '2026-11-20',
      currency: 'INR',
      budgetCap: 2500000,
    },
  };

  it('returns 400 when request body contains invalid JSON', async () => {
    const req = {
      json: vi.fn().mockRejectedValue(new Error('SyntaxError: Unexpected token')),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('MALFORMED_REQUEST');
  });

  it('returns 400 with details when request fails schema validation', async () => {
    const invalidPayload = {
      ...validPayload,
      userPrompt: '', // Empty prompt violates min(1)
    };

    const req = {
      json: vi.fn().mockResolvedValue(invalidPayload),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toBeDefined();
  });

  it('returns 200 with structured response on successful generation', async () => {
    vi.spyOn(provider, 'generateAssistantResponse').mockResolvedValueOnce({
      success: true,
      data: {
        answer: 'You have a healthy reserve allocation.',
        summary: 'Review catering estimates.',
        recommendations: ['Confirm headcount 30 days prior.'],
        proposals: [],
        modelUsed: 'gemini-3.8-flash',
        timestamp: '2026-10-21T17:00:00.000Z',
      },
    });

    const req = {
      json: vi.fn().mockResolvedValue(validPayload),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.answer).toContain('healthy reserve');
    expect(body.modelUsed).toBe('gemini-3.8-flash');
  });

  it('maps provider 503 error to HTTP 503 without leaking credentials', async () => {
    vi.spyOn(provider, 'generateAssistantResponse').mockResolvedValueOnce({
      success: false,
      error: {
        code: 'MODEL_UNAVAILABLE',
        message: 'Gemini 3.8 Flash is currently experiencing high demand. Please try again shortly.',
        status: 503,
      },
    });

    const req = {
      json: vi.fn().mockResolvedValue(validPayload),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('MODEL_UNAVAILABLE');
    expect(body.error).toContain('high demand');
  });
});
