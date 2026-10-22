import { NextRequest, NextResponse } from 'next/server';
import { AiAssistantRequestSchema } from '../../../features/ai/schemas';
import { orchestrateAssistantResponse } from '../../../features/ai/ai-orchestrator';

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

    const validated = AiAssistantRequestSchema.safeParse(body);
    if (!validated.success) {
      const issues = validated.error.issues || (validated.error as any).errors || [];
      return NextResponse.json(
        {
          error: 'Validation failed for request parameters.',
          details: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : '',
            message: e.message,
          })),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      ...result.data,
    });
  } catch (err: any) {
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
