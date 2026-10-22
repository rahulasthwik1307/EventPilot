import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  cleanJsonOutput,
  extractCloudflareContent,
  generateCloudflareAssistantResponse,
  isVerifiedFreeModel,
  VERIFIED_FREE_CLOUDFLARE_MODELS,
} from '../cloudflare-provider';
import { AiAssistantRequest } from '../types';

describe('cloudflare-provider (Server Provider Adapter)', () => {
  const mockRequest: AiAssistantRequest = {
    eventId: 'test-event-cf',
    intent: 'budget',
    userPrompt: 'How should we adjust mandap floral decor?',
    context: {
      eventType: 'wedding',
      title: "Aarav & Meera's Vivaha",
      date: '2026-11-20',
      currency: 'INR',
      budgetCap: 2500000,
      categorySummary: [{ name: 'Decor & Florals', allocatedAmount: 450000 }],
    },
  };

  const validModelResponseText = JSON.stringify({
    answer: 'Focus entrance budget on marigold toranams and tuberose garlands.',
    summary: 'Allocate 35% of floral budget to the entrance.',
    recommendations: ['Order marigolds 2 days prior.'],
    proposals: [
      {
        actionType: 'adjust_budget_allocation',
        title: 'Entrance Floral Headroom',
        explanation: 'Temple pillar garlands require modest contingency.',
        payload: {
          actionType: 'adjust_budget_allocation',
          categoryName: 'Decor & Florals',
          currentAllocated: 450000,
          proposedAllocated: 490000,
          rationale: 'Entrance garland setup',
        },
      },
    ],
  });

  beforeEach(() => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-cf-account-id';
    process.env.CLOUDFLARE_API_TOKEN = 'test-cf-api-token';
  });

  it('validates verified free-tier models correctly', () => {
    expect(isVerifiedFreeModel('@cf/meta/llama-3.3-70b-instruct-fp8-fast')).toBe(true);
    expect(isVerifiedFreeModel('@cf/meta/llama-3.1-8b-instruct-fp8')).toBe(true);
    expect(isVerifiedFreeModel('@cf/meta/llama-3.2-3b-instruct')).toBe(true);
    // Paid models must be rejected
    expect(isVerifiedFreeModel('@cf/deepseek-ai/deepseek-v4-pro-0813')).toBe(false);
    expect(isVerifiedFreeModel('@cf/zai-org/glm-5.2')).toBe(false);
    expect(isVerifiedFreeModel('unverified-custom-model')).toBe(false);
  });

  it('extracts content from both text and chat completion formats', () => {
    // Standard format
    expect(extractCloudflareContent({ response: 'hello' })).toBe('hello');
    // Chat completion format
    expect(
      extractCloudflareContent({
        choices: [{ message: { content: 'chat format hello' } }],
      })
    ).toBe('chat format hello');
    // Empty/invalid
    expect(extractCloudflareContent(null)).toBeNull();
    expect(extractCloudflareContent({})).toBeNull();
  });

  it('cleans markdown code block fences from JSON output', () => {
    const fenced = '```json\n{"status": "ok"}\n```';
    expect(cleanJsonOutput(fenced)).toBe('{"status": "ok"}');

    const fencedNoLang = '```\n{"status": "ok"}\n```';
    expect(cleanJsonOutput(fencedNoLang)).toBe('{"status": "ok"}');

    const clean = '{"status": "ok"}';
    expect(cleanJsonOutput(clean)).toBe('{"status": "ok"}');
  });

  it('rejects unverified or paid models immediately without invoking network', async () => {
    const mockFetch = vi.fn();
    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      '@cf/deepseek-ai/deepseek-v4-pro-0813',
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('PAID_MODEL_BLOCKED');
    expect(res.error?.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns CONFIG_MISSING when credentials are not configured', async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;

    const res = await generateCloudflareAssistantResponse(mockRequest);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('CONFIG_MISSING');
    expect(res.error?.status).toBe(500);
  });

  it('parses valid Cloudflare response and stages proposals with IDs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        result: { response: validModelResponseText },
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(true);
    expect(res.data?.answer).toContain('entrance budget on marigold');
    expect(res.data?.modelUsed).toBe(VERIFIED_FREE_CLOUDFLARE_MODELS[0]);
    expect(res.data?.provider).toBe('cloudflare');
    expect(res.data?.proposals).toHaveLength(1);
    expect(res.data?.proposals[0].status).toBe('staged');
    expect(res.data?.proposals[0].id).toMatch(/^prop-\d+-1$/);
  });

  it('parses chat completion format ({ choices: [...] }) successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        result: {
          choices: [{ message: { content: validModelResponseText } }],
        },
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(true);
    expect(res.data?.answer).toContain('entrance budget');
  });

  it('maps HTTP 401 to AUTH_ERROR status 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        success: false,
        errors: [{ code: 10000, message: 'Authentication error' }],
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('AUTH_ERROR');
    expect(res.error?.status).toBe(401);
  });

  it('maps 403 paid-model error to PAID_MODEL_BLOCKED status 403', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({
        success: false,
        errors: [
          {
            code: 5035,
            message: 'Model is not available on the Workers Free plan. Upgrade to access this model.',
          },
        ],
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('PAID_MODEL_BLOCKED');
    expect(res.error?.status).toBe(403);
  });

  it('maps 429 quota exhaustion (10k neurons) to QUOTA_EXCEEDED status 429', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({
        success: false,
        errors: [
          {
            code: 3036,
            message: 'You have used up your daily free allocation of 10,000 neurons.',
          },
        ],
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('QUOTA_EXCEEDED');
    expect(res.error?.status).toBe(429);
  });

  it('maps 429 capacity spike to CAPACITY_EXCEEDED status 429', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({
        success: false,
        errors: [
          {
            code: 3040,
            message: 'Capacity temporarily exceeded, please try again.',
          },
        ],
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('CAPACITY_EXCEEDED');
    expect(res.error?.status).toBe(429);
  });

  it('maps 503 server error to SERVER_ERROR status 503', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({
        success: false,
        errors: [{ message: 'Service Temporarily Unavailable' }],
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('SERVER_ERROR');
    expect(res.error?.status).toBe(503);
  });

  it('maps malformed JSON response to INVALID_JSON status 502', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        result: { response: 'this is not valid json' },
      }),
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('INVALID_JSON');
    expect(res.error?.status).toBe(502);
  });

  it('handles abort/timeout cleanly with TIMEOUT status 504', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const res = await generateCloudflareAssistantResponse(
      mockRequest,
      VERIFIED_FREE_CLOUDFLARE_MODELS[0],
      { fetchFn: mockFetch }
    );

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('TIMEOUT');
    expect(res.error?.status).toBe(504);
  });
});
