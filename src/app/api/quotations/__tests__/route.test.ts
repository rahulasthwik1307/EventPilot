import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/quotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/quotations route', () => {
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
  });

  it('generates comparison insights for quotations', async () => {
    const q1 = {
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

    const q2 = {
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

    const req = createMockPostRequest({
      action: 'compare_insights',
      payload: {
        quotations: [q1, q2],
        eventContext: {
          title: 'Royal Wedding',
          eventType: 'wedding',
          guestTarget: 300,
          date: '2026-11-20',
        },
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.findings.length).toBeGreaterThan(0);
  });
});
