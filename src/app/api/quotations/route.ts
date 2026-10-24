import { NextRequest, NextResponse } from 'next/server';
import { QuotationsApiRequestSchema } from '@/features/ai/quotation-schemas';
import {
  extractQuotationWithAi,
  generateComparisonInsightsWithAi,
} from '@/features/ai/quotation-extractor';

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON request payload.',
          code: 'MALFORMED_REQUEST',
        },
        { status: 400 }
      );
    }

    const validated = QuotationsApiRequestSchema.safeParse(body);
    if (!validated.success) {
      const issues = validated.error.issues || (validated.error as any).errors || [];
      return NextResponse.json(
        {
          error: 'Validation failed for quotation request parameters.',
          details: issues.map((e: any) => ({
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

      return NextResponse.json({
        success: true,
        data: extractionResult.data,
        provider: extractionResult.provider,
      });
    }

    if (reqData.action === 'compare_insights') {
      const { quotations, eventContext } = reqData.payload;
      const insights = await generateComparisonInsightsWithAi(quotations, eventContext);

      return NextResponse.json({
        success: true,
        data: insights,
      });
    }

    return NextResponse.json(
      {
        error: 'Unsupported action',
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  } catch (err: any) {
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
