import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { resetRateLimits } from '@/features/ai/rate-limiter';

function createMockPostRequest(body: any, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/quotations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': '203.0.113.150',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/quotations route', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  const validQuote1 = {
    id: 'q1',
    vendorName: 'Studio A',
    serviceCategory: 'photography',
    title: 'Grand Package',
    quotedTotal: 150000,
    currency: 'INR',
    quoteDate: '2026-11-20',
    includedServices: [{ description: '2 Photographers' }, { description: 'Drone coverage' }],
    exclusions: [],
    optionalAddOns: [],
    taxesAndFees: [],
    paymentMilestones: [],
    cancellationPolicy: 'Refundable up to 30 days',
    provenance: 'user_manual',
    status: 'active',
    createdAt: '2026-11-20',
    updatedAt: '2026-11-20',
  };

  const validQuote2 = {
    id: 'q2',
    vendorName: 'Studio B',
    serviceCategory: 'photography',
    title: 'Basic Package',
    quotedTotal: 120000,
    currency: 'INR',
    quoteDate: '2026-11-20',
    includedServices: [{ description: '2 Photographers' }],
    exclusions: ['Drone coverage'],
    optionalAddOns: [],
    taxesAndFees: [],
    paymentMilestones: [],
    provenance: 'user_manual',
    status: 'active',
    createdAt: '2026-11-20',
    updatedAt: '2026-11-20',
  };

  const validContext = {
    title: 'Royal Wedding',
    eventType: 'wedding',
    guestTarget: 300,
    date: '2026-11-20',
  };

  it('returns 400 for malformed JSON request', async () => {
    const req = new NextRequest('http://localhost:3000/api/quotations', {
      method: 'POST',
      body: 'invalid-json{{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('MALFORMED_REQUEST');
  });

  it('returns 400 when validation fails on missing fields', async () => {
    const req = createMockPostRequest({ action: 'extract', payload: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('extracts quotation data deterministically from sample quotation text', async () => {
    const rawQuoteText = `
Vendor: Silver Screen Memories
Package: Royal Wedding Photography
Total Quoted: ₹1,50,000
Date: 2026-11-20
Validity: 2026-12-15
Inclusions:
- 2 Candid Photographers (₹80,000)
- 1 Cinematographer (₹70,000)
- Drone coverage
Exclusions:
- Outstation accommodation
Deposit: ₹50,000
GST: 18% included
Cancellation: Refundable up to 30 days before event
`;

    const req = createMockPostRequest({
      action: 'extract',
      payload: {
        sourceText: rawQuoteText,
        currency: 'INR',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.vendorName).toBe('Silver Screen Memories');
    expect(body.data.quotedTotal).toBe(150000);
    expect(body.data.includedServices.length).toBeGreaterThan(0);
    expect(body.data.depositRequired).toBe(50000);
    expect(body.data.exclusions).toContain('Outstation accommodation');
    expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });

  it('generates comparison insights for quotations', async () => {
    const req = createMockPostRequest({
      action: 'compare_insights',
      payload: {
        quotations: [validQuote1, validQuote2],
        eventContext: validContext,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.findings.length).toBeGreaterThan(0);
  });

  it('rejects comparison request with fewer than 2 quotations', async () => {
    const req = createMockPostRequest({
      action: 'compare_insights',
      payload: {
        quotations: [validQuote1],
        eventContext: validContext,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.some((d: any) => /At least 2 quotations required/i.test(d.message))).toBe(true);
  });

  it('rejects comparison request with more than 10 quotations', async () => {
    const elevenQuotes = Array.from({ length: 11 }, (_, i) => ({
      ...validQuote1,
      id: `q${i + 1}`,
      vendorName: `Vendor ${i + 1}`,
    }));

    const req = createMockPostRequest({
      action: 'compare_insights',
      payload: {
        quotations: elevenQuotes,
        eventContext: validContext,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.some((d: any) => /maximum of 10 quotations/i.test(d.message))).toBe(true);
  });

  it('rejects comparison request with malformed quotation objects', async () => {
    const malformedQuote = {
      // Missing vendorName
      serviceCategory: 'invalid_category', // Invalid category
      quotedTotal: -500,                  // Negative cost
    };

    const req = createMockPostRequest({
      action: 'compare_insights',
      payload: {
        quotations: [validQuote1, malformedQuote],
        eventContext: validContext,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.length).toBeGreaterThan(0);
  });

  it('safely handles comparison when quotations have missing/empty includedServices without throwing 500', async () => {
    const quoteWithoutServices1 = {
      ...validQuote1,
      includedServices: [],
    };
    const quoteWithoutServices2 = {
      ...validQuote2,
      includedServices: [],
    };

    const req = createMockPostRequest({
      action: 'compare_insights',
      payload: {
        quotations: [quoteWithoutServices1, quoteWithoutServices2],
        eventContext: validContext,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.findings)).toBe(true);
  });

  it('enforces rate limits on /api/quotations returning 429 when threshold exceeded', async () => {
    const createReq = () =>
      createMockPostRequest(
        {
          action: 'compare_insights',
          payload: {
            quotations: [validQuote1, validQuote2],
            eventContext: validContext,
          },
        },
        { 'cf-connecting-ip': '203.0.113.199' }
      );

    // 10 requests allowed
    for (let i = 0; i < 10; i++) {
      const res = await POST(createReq());
      expect(res.status).toBe(200);
    }

    // 11th request blocked
    const blockedRes = await POST(createReq());
    expect(blockedRes.status).toBe(429);
    const body = await blockedRes.json();
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
  });

  it('rejects oversized quotation payload with HTTP 413 before parsing or downstream calls', async () => {
    const oversizedString = 'x'.repeat(140 * 1024); // 140 KB exceeds 128 KB limit
    const req = new NextRequest('http://localhost:3000/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.200',
      },
      body: JSON.stringify({
        action: 'extract',
        payload: {
          sourceText: oversizedString,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
