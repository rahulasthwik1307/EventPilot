import { describe, expect, it, vi } from 'vitest';
import {
  getActiveCloudflareModels,
  orchestrateAssistantResponse,
} from '../ai-orchestrator';
import { AiAssistantRequest, AiAssistantResponse } from '../types';

describe('ai-orchestrator (Multi-Model Failover & Gemini Fallback)', () => {
  const mockRequest: AiAssistantRequest = {
    eventId: 'test-event-orch',
    intent: 'budget',
    userPrompt: 'Suggest florals allocation',
    context: {
      eventType: 'wedding',
      title: "Aarav & Meera's Vivaha",
      date: '2026-11-20',
      currency: 'INR',
      budgetCap: 2500000,
    },
  };

  const sampleSuccessPayload: AiAssistantResponse = {
    answer: 'Traditional jasmine and marigolds are cost-effective and auspicious.',
    summary: 'Adjust florals by ₹40,000.',
    recommendations: ['Check local flower mandi at 5 AM.'],
    proposals: [
      {
        id: 'prop-123-1',
        actionType: 'adjust_budget_allocation',
        title: 'Floral Toranam Headroom',
        explanation: 'Entrance garland setup',
        status: 'staged',
        payload: {
          actionType: 'adjust_budget_allocation',
          categoryName: 'Decor & Florals',
          currentAllocated: 450000,
          proposedAllocated: 490000,
          rationale: 'Temple pillar garlands',
        },
      },
    ],
    modelUsed: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    timestamp: '2026-10-22T07:00:00.000Z',
  };

  it('filters out unverified and paid models from custom/environment configurations', () => {
    const verified = getActiveCloudflareModels([
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/deepseek-ai/deepseek-v4-pro-0813', // paid-only
      'unknown-paid-model',                  // unverified
      '@cf/meta/llama-3.1-8b-instruct-fp8',
    ]);

    expect(verified).toEqual([
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/meta/llama-3.1-8b-instruct-fp8',
    ]);
  });

  // Scenario 1: Cloudflare primary succeeds with valid output
  it('Scenario 1: Cloudflare primary succeeds with valid output and returns provider=cloudflare', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: true,
      data: sampleSuccessPayload,
    });
    const mockGemini = vi.fn();

    const res = await orchestrateAssistantResponse(mockRequest, {
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.answer).toContain('Traditional jasmine and marigolds');
    expect(res.data?.provider).toBe('cloudflare');
    expect(mockCf).toHaveBeenCalledTimes(1);
  });

  // Scenario 2: Gemini is not called after successful Cloudflare output
  it('Scenario 2: Gemini is NEVER called when Cloudflare primary succeeds', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: true,
      data: sampleSuccessPayload,
    });
    const mockGemini = vi.fn();

    await orchestrateAssistantResponse(mockRequest, {
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    expect(mockGemini).not.toHaveBeenCalled();
  });

  // Scenario 3: First Cloudflare model fails temporarily and next succeeds
  it('Scenario 3: Advances to next Cloudflare model when the first model fails', async () => {
    const mockCf = vi
      .fn()
      .mockResolvedValueOnce({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Model 1 500 error', status: 500 },
      })
      .mockResolvedValueOnce({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Model 1 500 retry error', status: 500 },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          ...sampleSuccessPayload,
          modelUsed: '@cf/meta/llama-3.1-8b-instruct-fp8',
        },
      });

    const mockGemini = vi.fn();

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: [
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/meta/llama-3.1-8b-instruct-fp8',
      ],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 1,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.modelUsed).toBe('@cf/meta/llama-3.1-8b-instruct-fp8');
    expect(res.data?.provider).toBe('cloudflare');
    expect(mockGemini).not.toHaveBeenCalled();
  });

  // Scenario 4: Cloudflare returns 429 quota exhaustion and chain advances
  it('Scenario 4: Advances to Gemini when Cloudflare returns 429 quota exhaustion', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'QUOTA_EXCEEDED', message: 'Daily 10k neurons exhausted', status: 429 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.provider).toBe('gemini');
    expect(mockGemini).toHaveBeenCalledTimes(1);
  });

  // Scenario 5: Cloudflare returns 502/503/504 and chain advances correctly
  it('Scenario 5: Cloudflare returns 503 server error and chain advances to Gemini', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Cloudflare 503 error', status: 503 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.provider).toBe('gemini');
    expect(mockGemini).toHaveBeenCalledTimes(1);
  });

  // Scenario 6: Network failure and timeout trigger bounded failover
  it('Scenario 6: Network timeout on Cloudflare triggers failover to Gemini', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'TIMEOUT', message: 'Request timed out after 15000ms', status: 504 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.provider).toBe('gemini');
  });

  // Scenario 7: Malformed or schema-invalid response is rejected safely
  it('Scenario 7: Malformed or invalid schema output advances to next provider', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Broken JSON', status: 502 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.provider).toBe('gemini');
  });

  // Scenario 8: Paid-only model blocked and never retried as eligible free model
  it('Scenario 8: Paid-only model error advances immediately without retry loops', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'PAID_MODEL_BLOCKED', message: 'Requires paid Workers plan', status: 403 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 2, // Even with maxRetries=2, paid model error must NOT retry
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(mockCf).toHaveBeenCalledTimes(1); // Exactly 1 attempt, no retry
    expect(mockGemini).toHaveBeenCalledTimes(1);
  });

  // Scenario 9: All Cloudflare models fail and existing Gemini provider succeeds
  it('Scenario 9: All Cloudflare models fail and existing Gemini provider succeeds', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Temporary failure', status: 500 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: [
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/meta/llama-3.1-8b-instruct-fp8',
        '@cf/meta/llama-3.2-3b-instruct',
      ],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 0,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    expect(res.data?.provider).toBe('gemini');
    expect(res.data?.modelUsed).toBe('gemini-3.8-flash');
  });

  // Scenario 10: All Cloudflare models and Gemini fail, returning safe actionable error
  it('Scenario 10: All Cloudflare models and Gemini fail returning safe actionable error', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Cloudflare down', status: 503 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'MODEL_UNAVAILABLE', message: 'Gemini high demand', status: 503 },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 0,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(false);
    expect(res.error?.status).toBe(503);
    expect(res.error?.code).toBe('MODEL_UNAVAILABLE');
    expect(res.error?.message).toContain('experiencing high demand');
  });

  // Scenario 11: Invalid credentials do not cause endless retries
  it('Scenario 11: Invalid credentials (401) break immediately to Gemini fallback without retrying CF', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Invalid token', status: 401 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...sampleSuccessPayload,
        modelUsed: 'gemini-3.8-flash',
      },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: [
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/meta/llama-3.1-8b-instruct-fp8',
        '@cf/meta/llama-3.2-3b-instruct',
      ],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 2,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(true);
    // Because 401 is an account auth error, it should not test all 3 models repeatedly
    expect(mockCf).toHaveBeenCalledTimes(1);
    expect(mockGemini).toHaveBeenCalledTimes(1);
  });

  // Scenario 12: Retry limits are respected
  it('Scenario 12: Retry limits are strictly respected for transient errors', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'CAPACITY_EXCEEDED', message: 'Capacity busy', status: 429 },
    });

    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: sampleSuccessPayload,
    });

    await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 1, // 1 initial + 1 retry = 2 attempts
      retryDelayMs: 0,
    });

    expect(mockCf).toHaveBeenCalledTimes(2);
    expect(mockGemini).toHaveBeenCalledTimes(1);
  });

  // Scenario 13: Staged proposals maintain stable IDs and status
  it('Scenario 13: Staged proposals maintain status and format', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: true,
      data: sampleSuccessPayload,
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cfInvocationFn: mockCf,
      retryDelayMs: 0,
    });

    expect(res.data?.proposals[0].status).toBe('staged');
    expect(res.data?.proposals[0].id).toBe('prop-123-1');
  });

  // Scenario 14: Credentials are not exposed in responses
  it('Scenario 14: Never leaks credentials in response or error messages', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal error', status: 500 },
    });
    const mockGemini = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'GEMINI_FAILURE', message: 'Gemini 500', status: 500 },
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      retryDelayMs: 0,
    });

    const str = JSON.stringify(res);
    expect(str).not.toContain(process.env.CLOUDFLARE_API_TOKEN || 'dummy');
    expect(str).not.toContain(process.env.GEMINI_API_KEY || 'dummy');
  });

  // Scenario 15: Total attempts across providers are strictly bounded
  it('Scenario 15: Bounds total provider attempts across models and halts failover', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Temporary failure', status: 500 },
    });
    const mockGemini = vi.fn().mockResolvedValue({
      success: true,
      data: sampleSuccessPayload,
    });

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: [
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/meta/llama-3.1-8b-instruct-fp8',
        '@cf/meta/llama-3.2-3b-instruct',
      ],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      maxRetriesPerModel: 1,
      maxTotalAttempts: 2, // Hard bound to 2 attempts max
      retryDelayMs: 0,
    });

    // Should stop after 2 attempts without calling subsequent models or Gemini
    expect(mockCf).toHaveBeenCalledTimes(2);
    expect(mockGemini).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
  });

  // Scenario 16: Gemini fallback can be explicitly disabled
  it('Scenario 16: Prevents Gemini invocation when allowGeminiFallback is false', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Cloudflare failure', status: 500 },
    });
    const mockGemini = vi.fn();

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      allowGeminiFallback: false,
      maxRetriesPerModel: 0,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(false);
    expect(mockCf).toHaveBeenCalledTimes(1);
    expect(mockGemini).not.toHaveBeenCalled();
    expect(res.error?.status).toBe(503);
  });

  // Scenario 17: Returns 429 QUOTA_EXCEEDED when primary quota exhausted and fallback disabled
  it('Scenario 17: Returns 429 QUOTA_EXCEEDED when primary is exhausted and fallback disabled', async () => {
    const mockCf = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'QUOTA_EXCEEDED', message: 'Daily neurons exhausted', status: 429 },
    });
    const mockGemini = vi.fn();

    const res = await orchestrateAssistantResponse(mockRequest, {
      cloudflareModels: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      cfInvocationFn: mockCf,
      geminiInvocationFn: mockGemini,
      allowGeminiFallback: false,
      maxRetriesPerModel: 0,
      retryDelayMs: 0,
    });

    expect(res.success).toBe(false);
    expect(mockGemini).not.toHaveBeenCalled();
    expect(res.error?.code).toBe('QUOTA_EXCEEDED');
    expect(res.error?.status).toBe(429);
  });
});
