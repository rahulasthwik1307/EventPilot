import { NextRequest, NextResponse } from 'next/server';
import { AiAssistantRequestSchema } from '../../../features/ai/schemas';
import { orchestrateAssistantResponse } from '../../../features/ai/ai-orchestrator';
import {
  getClientIdentifier,
  checkRateLimit,
  parseJsonWithLimit,
  createRateLimitExceededResponse,
  attachRateLimitHeaders,
} from '../../../features/ai/rate-limiter';

// Maximum payload size for assistant requests: 64 KB
const MAX_ASSISTANT_BODY_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check by client identity
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(rateLimit);
    }

    // 2. Bounded body size and JSON parsing
    const bodyResult = await parseJsonWithLimit(req, MAX_ASSISTANT_BODY_BYTES);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    // 3. Schema validation
    const validated = AiAssistantRequestSchema.safeParse(bodyResult.data);
    if (!validated.success) {
      const issues = validated.error.issues;
      return NextResponse.json(
        {
          error: 'Validation failed for request parameters.',
          details: issues.map((e) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : '',
            message: e.message,
          })),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 4. AI Orchestration
    const result = await orchestrateAssistantResponse(validated.data);

    if (!result.success || !result.data) {
      const err = result.error || {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        status: 500,
      };

      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: err.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      ...result.data,
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (err: unknown) {
    const _errorMessage = err instanceof Error ? err.message : String(err);
    // Top-level catch to guarantee secrets and stack traces are never leaked
    return NextResponse.json(
      {
        error: 'An internal server error occurred processing the assistant request.',
        code: 'UNEXPECTED_FAILURE',
      },
      { status: 500 }
    );
  }
}
