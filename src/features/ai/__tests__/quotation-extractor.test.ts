import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractQuotationDeterministically,
  extractQuotationWithAi,
  generateComparisonInsightsWithAi,
} from '../quotation-extractor';
import { ExtractedQuotationOutputSchema } from '../quotation-schemas';
import { ComparisonQuotationItem } from '../quotation-schemas';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

describe('quotation-extractor (Deterministic & AI Quotation Parsing)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T12:00:00.000Z'));
    mockGenerateContent.mockReset();
    process.env = { ...originalEnv };
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
  });

  describe('extractQuotationDeterministically', () => {
    it('detects amount and INR currency symbol correctly', () => {
      const text = `
Vendor: Sri Ranga Caterers
Package: Royal Kalyanam Feast
Total Quoted: ₹2,75,000
Date: 2026-11-20
`;
      const result = extractQuotationDeterministically(text);
      expect(result.vendorName).toBe('Sri Ranga Caterers');
      expect(result.title).toBe('Royal Kalyanam Feast');
      expect(result.quotedTotal).toBe(275000);
      expect(result.currency).toBe('INR');
      expect(result.quoteDate).toBe('2026-11-20');
      expect(ExtractedQuotationOutputSchema.safeParse(result).success).toBe(true);
    });

    it('detects USD, EUR, and GBP currency symbols and decimal amounts', () => {
      const usdText = 'Studio: New York Visions\nService: Wedding Shoot\nGrand Total: $3,500.50';
      const usdResult = extractQuotationDeterministically(usdText);
      expect(usdResult.currency).toBe('USD');
      expect(usdResult.quotedTotal).toBe(3500.5);

      const eurText = 'Company: Paris Events\nOption: Floral Design\nAmount Payable: €4,200';
      const eurResult = extractQuotationDeterministically(eurText);
      expect(eurResult.currency).toBe('EUR');
      expect(eurResult.quotedTotal).toBe(4200);

      const gbpText = 'Artist: London DJ Beats\nPlan: Reception Party\nPackage Cost: £1,800';
      const gbpResult = extractQuotationDeterministically(gbpText);
      expect(gbpResult.currency).toBe('GBP');
      expect(gbpResult.quotedTotal).toBe(1800);
    });

    it('respects currency option override when no currency symbol is found', () => {
      const text = 'Vendor: Generic Vendor\nTitle: Basic Plan\nTotal: 50000';
      const result = extractQuotationDeterministically(text, { currency: 'EUR' });
      expect(result.currency).toBe('EUR');
      expect(result.quotedTotal).toBe(50000);
    });

    it('extracts line item inclusions, costs, exclusions, and GST taxes', () => {
      const text = `
Vendor: Golden Mandap Decors
Package: Temple Heritage Mandap
Total: ₹4,00,000
GST @ 18% included
Inclusions:
- Handcrafted Marigold Mandap (₹2,50,000)
- Tuberose Aisle Garlands (₹1,00,000)
- Stage Lighting (₹50,000)
Exclusions:
- Generator diesel costs
- Venue cleanup fees
Deposit: ₹1,00,000
Cancellation: 100% refund up to 30 days before celebration
`;
      const result = extractQuotationDeterministically(text);
      expect(result.includedServices).toHaveLength(3);
      expect(result.includedServices[0].description).toBe('Handcrafted Marigold Mandap (₹2,50,000)');
      expect(result.includedServices[0].itemizedCost).toBe(250000);
      expect(result.exclusions).toHaveLength(2);
      expect(result.exclusions).toContain('Generator diesel costs');
      expect(result.depositRequired).toBe(100000);
      expect(result.paymentMilestones).toHaveLength(1);
      expect(result.paymentMilestones[0].amount).toBe(100000);
      expect(result.cancellationPolicy).toContain('100% refund');
      expect(result.taxesAndFees).toHaveLength(1);
      expect(result.taxesAndFees[0].name).toBe('GST 18%');
      expect(result.taxesAndFees[0].amount).toBe(72000);
    });

    it('determines vendor category automatically using keyword heuristics', () => {
      expect(
        extractQuotationDeterministically('Vendor: Studio\nDrone camera and album package: ₹100000').serviceCategory
      ).toBe('photography');

      expect(
        extractQuotationDeterministically('Vendor: Caterers\nBuffet lunch menu: ₹100000').serviceCategory
      ).toBe('catering');

      expect(
        extractQuotationDeterministically('Vendor: Palace Lawn\nBallroom banquet hall: ₹100000').serviceCategory
      ).toBe('venue');

      expect(
        extractQuotationDeterministically('Vendor: Flora\nFloral mandap stage decoration: ₹100000').serviceCategory
      ).toBe('decoration');

      expect(
        extractQuotationDeterministically('Vendor: Sound Masters\nDJ sound and dhol: ₹100000').serviceCategory
      ).toBe('music_dj');

      expect(
        extractQuotationDeterministically('Vendor: Service Co\nConsulting services: ₹50000').serviceCategory
      ).toBe('other');
    });

    it('respects category option override over keyword heuristics', () => {
      const text = 'Vendor: Fusion\nFood catering and sound: ₹150000';
      const result = extractQuotationDeterministically(text, { category: 'equipment_rentals' });
      expect(result.serviceCategory).toBe('equipment_rentals');
    });

    it('handles empty input and whitespace-only text safely without throwing', () => {
      const emptyResult = extractQuotationDeterministically('');
      expect(emptyResult.vendorName).toBe('Vendor');
      expect(emptyResult.title).toBe('Service Quotation');
      expect(emptyResult.quotedTotal).toBe(0);
      expect(emptyResult.quoteDate).toBe('2026-10-27'); // Fake timer date
      expect(emptyResult.includedServices).toEqual([{ description: 'Complete service package' }]);
      expect(ExtractedQuotationOutputSchema.safeParse(emptyResult).success).toBe(true);

      const whitespaceResult = extractQuotationDeterministically('   \n\n\t  \n  ');
      expect(whitespaceResult.vendorName).toBe('Vendor');
      expect(ExtractedQuotationOutputSchema.safeParse(whitespaceResult).success).toBe(true);
    });

    it('handles malformed and noisy text gracefully', () => {
      const malformedText = `
### $$$ random garbage text %%%
??? :::::
No obvious tags or labels
Some line with number 99999999 but no currency
Another line
`;
      const result = extractQuotationDeterministically(malformedText);
      expect(result).toBeDefined();
      expect(typeof result.quotedTotal).toBe('number');
      expect(ExtractedQuotationOutputSchema.safeParse(result).success).toBe(true);
    });
  });

  describe('extractQuotationWithAi', () => {
    const validAiResponseObject = {
      vendorName: 'Luxe Moments Studio',
      serviceCategory: 'photography',
      title: 'Cinematic Royal Wedding',
      quotedTotal: 250000,
      currency: 'INR',
      quoteDate: '2026-11-20',
      includedServices: [{ description: 'Traditional + Candid Cinema' }],
      exclusions: ['Travel allowance'],
      optionalAddOns: [],
      taxesAndFees: [],
      paymentMilestones: [],
    };

    it('returns Cloudflare extraction when Cloudflare API responds with valid JSON', async () => {
      process.env.CLOUDFLARE_API_TOKEN = 'mock-cf-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'mock-cf-acc';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            response: JSON.stringify(validAiResponseObject),
          },
        }),
      });

      const result = await extractQuotationWithAi('Some quotation text for Cloudflare', {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.provider).toBe('cloudflare');
      expect(result.data.vendorName).toBe('Luxe Moments Studio');
      expect(result.data.quotedTotal).toBe(250000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('falls back to Gemini when Cloudflare returns non-200 and Gemini succeeds', async () => {
      process.env.CLOUDFLARE_API_TOKEN = 'mock-cf-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'mock-cf-acc';
      process.env.GEMINI_API_KEY = 'mock-gemini-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          ...validAiResponseObject,
          vendorName: 'Gemini Extracted Vendor',
        }),
      });

      const result = await extractQuotationWithAi('Quotation text requiring fallback', {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.provider).toBe('gemini');
      expect(result.data.vendorName).toBe('Gemini Extracted Vendor');
    });

    it('falls back to deterministic extraction when both Cloudflare and Gemini fail', async () => {
      process.env.CLOUDFLARE_API_TOKEN = 'mock-cf-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'mock-cf-acc';
      process.env.GEMINI_API_KEY = 'mock-gemini-key';

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error on Cloudflare'));
      mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API quota exceeded'));

      const rawText = 'Vendor: Resilient Caterers\nTotal: ₹1,20,000';
      const result = await extractQuotationWithAi(rawText, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.provider).toBe('deterministic');
      expect(result.data.vendorName).toBe('Resilient Caterers');
      expect(result.data.quotedTotal).toBe(120000);
    });

    it('falls back to deterministic extraction when Cloudflare returns invalid JSON and Gemini is disabled', async () => {
      process.env.CLOUDFLARE_API_TOKEN = 'mock-cf-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'mock-cf-acc';
      process.env.ENABLE_GEMINI_FALLBACK = 'false';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            response: 'Invalid non-JSON model answer',
          },
        }),
      });

      const rawText = 'Vendor: Fallback Vendor\nTotal: ₹85,000';
      const result = await extractQuotationWithAi(rawText, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.provider).toBe('deterministic');
      expect(result.data.vendorName).toBe('Fallback Vendor');
      expect(result.data.quotedTotal).toBe(85000);
    });

    it('uses deterministic extraction directly when no API credentials are provided', async () => {
      const rawText = 'Vendor: Direct Offline Vendor\nTotal: ₹50,000';
      const result = await extractQuotationWithAi(rawText);

      expect(result.provider).toBe('deterministic');
      expect(result.data.vendorName).toBe('Direct Offline Vendor');
      expect(result.data.quotedTotal).toBe(50000);
    });
  });

  describe('generateComparisonInsightsWithAi', () => {
    const context = {
      title: "Aarav & Meera's Vivaha",
      eventType: 'wedding',
      guestTarget: 300,
      date: '2026-11-20',
    };

    const quoteA: ComparisonQuotationItem = {
      id: 'q-a',
      vendorName: 'Studio Alpha',
      serviceCategory: 'photography',
      title: 'Full Drone Wedding Package',
      quotedTotal: 200000,
      currency: 'INR',
      includedServices: [{ description: '2 Candid Photographers' }, { description: '4K Drone Aerial Coverage' }],
      cancellationPolicy: '100% refund up to 30 days before event',
      exclusions: [],
      optionalAddOns: [],
      taxesAndFees: [],
      paymentMilestones: [],
    };

    const quoteB: ComparisonQuotationItem = {
      id: 'q-b',
      vendorName: 'Studio Beta',
      serviceCategory: 'photography',
      title: 'Ground Photography Only',
      quotedTotal: 175000,
      currency: 'INR',
      includedServices: [{ description: '2 Candid Photographers' }],
      exclusions: ['Drone coverage'],
      optionalAddOns: [],
      taxesAndFees: [],
      paymentMilestones: [],
    };

    it('returns empty findings if fewer than 2 quotations are provided', async () => {
      const resSingle = await generateComparisonInsightsWithAi([quoteA], context);
      expect(resSingle.findings).toEqual([]);

      const resEmpty = await generateComparisonInsightsWithAi([], context);
      expect(resEmpty.findings).toEqual([]);
    });

    it('generates a scope finding when one vendor bundles drone coverage and another omits it', async () => {
      const result = await generateComparisonInsightsWithAi([quoteA, quoteB], context);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);

      const scopeFinding = result.findings.find((f) => f.dimension === 'scope');
      expect(scopeFinding).toBeDefined();
      expect(scopeFinding?.severity).toBe('info');
      expect(scopeFinding?.summary).toContain('Aerial Footage Coverage');
      expect(scopeFinding?.detail).toContain('Studio Alpha');
      expect(scopeFinding?.detail).toContain('Studio Beta');
    });

    it('generates a cancellation warning when one vendor defines terms and another lacks them', async () => {
      const result = await generateComparisonInsightsWithAi([quoteA, quoteB], context);
      const cancellationFinding = result.findings.find((f) => f.dimension === 'cancellation');
      expect(cancellationFinding).toBeDefined();
      expect(cancellationFinding?.severity).toBe('warning');
      expect(cancellationFinding?.summary).toContain('Contractual Risk');
      expect(cancellationFinding?.detail).toContain('Studio Beta');
    });

    it('handles quotations across different categories without emitting spurious findings', async () => {
      const catererQuote: ComparisonQuotationItem = {
        id: 'q-c',
        vendorName: 'Royal Catering',
        serviceCategory: 'catering',
        title: 'Dinner Buffet',
        quotedTotal: 300000,
        currency: 'INR',
        includedServices: [{ description: 'Buffet line' }],
        exclusions: [],
        optionalAddOns: [],
        taxesAndFees: [],
        paymentMilestones: [],
      };

      const result = await generateComparisonInsightsWithAi([quoteA, catererQuote], context);
      expect(result.findings).toEqual([]);
    });
  });
});
