import { NextRequest, NextResponse } from 'next/server';
import { QuotationsApiRequestSchema } from '@/features/ai/quotation-schemas';
import {
  extractQuotationWithAi,
  generateComparisonInsightsWithAi,
} from '@/features/ai/quotation-extractor';
import {
  getClientIdentifier,
  checkRateLimit,
  parseJsonWithLimit,
  createRateLimitExceededResponse,
  attachRateLimitHeaders,
} from '@/features/ai/rate-limiter';

// Maximum payload size for quotation requests: 128 KB
const MAX_QUOTATION_BODY_BYTES = 128 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check by client identity
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(rateLimit);
    }

    // 2. Bounded body size and JSON parsing
    const bodyResult = await parseJsonWithLimit(req, MAX_QUOTATION_BODY_BYTES);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    // 3. Schema validation
    const validated = QuotationsApiRequestSchema.safeParse(bodyResult.data);
    if (!validated.success) {
      const issues = validated.error.issues;
      return NextResponse.json(
        {
          error: 'Validation failed for quotation request parameters.',
          details: issues.map((e) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : '',
            message: e.message,
          })),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const reqData = validated.data;

    if (reqData.action === 'extract') {
      const { sourceText, category, currency } = reqData.payload;
      const extractionResult = await extractQuotationWithAi(sourceText, {
        category,
        currency,
      });

      const response = NextResponse.json({
        success: true,
        data: extractionResult.data,
        provider: extractionResult.provider,
      });
      return attachRateLimitHeaders(response, rateLimit);
    }

    if (reqData.action === 'compare_insights') {
      const { quotations, eventContext } = reqData.payload;
      const insights = await generateComparisonInsightsWithAi(quotations, eventContext);

      const response = NextResponse.json({
        success: true,
        data: insights,
      });
      return attachRateLimitHeaders(response, rateLimit);
    }

    return NextResponse.json(
      {
        error: 'Unsupported action',
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const _errorMessage = err instanceof Error ? err.message : String(err);
    // Guaranteed non-leaking error response
    return NextResponse.json(
      {
        error: 'An unexpected internal error occurred while processing quotation request.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
