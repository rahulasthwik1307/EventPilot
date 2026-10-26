import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as orchestrator from '../../../../features/ai/ai-orchestrator';
import { resetRateLimits } from '../../../../features/ai/rate-limiter';

describe('POST /api/assistant (App Router API Route)', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.restoreAllMocks();
  });

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

  it('returns 200 with structured response on successful generation via orchestrator', async () => {
    vi.spyOn(orchestrator, 'orchestrateAssistantResponse').mockResolvedValueOnce({
      success: true,
      data: {
        answer: 'You have a healthy reserve allocation.',
        summary: 'Review catering estimates.',
        recommendations: ['Confirm headcount 30 days prior.'],
        proposals: [],
        modelUsed: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        provider: 'cloudflare',
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
    expect(body.modelUsed).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    expect(body.provider).toBe('cloudflare');
    expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });

  it('maps provider 503 error to HTTP 503 without leaking credentials', async () => {
    vi.spyOn(orchestrator, 'orchestrateAssistantResponse').mockResolvedValueOnce({
      success: false,
      error: {
        code: 'MODEL_UNAVAILABLE',
        message: 'AI Planning Assistant services are currently experiencing high demand. Please try again shortly.',
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

  it('validates and accepts request context with preference summary and returns update_preference proposals', async () => {
    vi.spyOn(orchestrator, 'orchestrateAssistantResponse').mockResolvedValueOnce({
      success: true,
      data: {
        answer: 'Wheelchair access arrangements proposed.',
        summary: 'Confirm logistics preference.',
        recommendations: ['Check venue ramp width.'],
        proposals: [
          {
            id: 'prop-pref-route',
            actionType: 'update_preference',
            title: 'Ramp Access',
            explanation: 'Elderly guest mobility.',
            status: 'staged',
            payload: {
              actionType: 'update_preference',
              category: 'logistics',
              field: 'accessibilityRequirements',
              proposedValue: { accessibilityRequirements: ['wheelchair_access'] },
              provenance: 'explicit',
              rationale: 'Accessibility needs',
            },
          },
        ],
        modelUsed: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        provider: 'cloudflare',
        timestamp: '2026-10-21T17:00:00.000Z',
      },
    });

    const payloadWithPreferences = {
      ...validPayload,
      context: {
        ...validPayload.context,
        preferencesSummary: {
          priorities: ['guest_hospitality'],
          accessibility: ['wheelchair_access'],
        },
      },
    };

    const req = {
      json: vi.fn().mockResolvedValue(payloadWithPreferences),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.proposals[0].actionType).toBe('update_preference');
  });

  it('enforces rate limits and returns 429 when threshold exceeded', async () => {
    const orchestratorSpy = vi.spyOn(orchestrator, 'orchestrateAssistantResponse').mockResolvedValue({
      success: true,
      data: {
        answer: 'Response',
        summary: 'Summary',
        recommendations: [],
        proposals: [],
        modelUsed: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        provider: 'cloudflare',
        timestamp: '2026-10-21T17:00:00.000Z',
      },
    });

    const createRequest = () =>
      new NextRequest('http://localhost:3000/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '203.0.113.88',
        },
        body: JSON.stringify(validPayload),
      });

    // Default rate limit is 10 requests per minute
    for (let i = 0; i < 10; i++) {
      const res = await POST(createRequest());
      expect(res.status).toBe(200);
    }

    // 11th request must be rate-limited
    const rateLimitedRes = await POST(createRequest());
    expect(rateLimitedRes.status).toBe(429);
    const body = await rateLimitedRes.json();
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(rateLimitedRes.headers.get('Retry-After')).toBeDefined();

    // Orchestrator must NOT have been called for the 11th request
    expect(orchestratorSpy).toHaveBeenCalledTimes(10);
  });

  it('rejects oversized payloads with HTTP 413 before parsing or AI orchestration', async () => {
    const orchestratorSpy = vi.spyOn(orchestrator, 'orchestrateAssistantResponse');

    // 70 KB payload exceeds 64 KB limit
    const oversizedString = 'x'.repeat(70 * 1024);
    const req = new NextRequest('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.89',
      },
      body: JSON.stringify({ ...validPayload, userPrompt: oversizedString }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.code).toBe('PAYLOAD_TOO_LARGE');
    expect(orchestratorSpy).not.toHaveBeenCalled();
  });
});
