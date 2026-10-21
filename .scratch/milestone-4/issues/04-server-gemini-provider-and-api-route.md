# 04: Server-Side Gemini Provider & API Route

**Status:** closed  
**Blocked by:** 01, 03

## What to build
Implement the server-side Gemini provider (`src/features/ai/gemini-provider.ts`) and API route (`src/app/api/assistant/route.ts`).

## Acceptance Criteria
- [x] Connects via `@google/genai` targeting exact model `gemini-3.8-flash`.
- [x] Configures `responseMimeType: 'application/json'` and JSON schema for structured output.
- [x] Enforces prompt bounding, timeouts, and bounded retry policy.
- [x] Graceful error mapping: 503 Service Unavailable, 429 Quota Exceeded, 401 Auth Error, 502 Parsing Error.
- [x] Never exposes API key or raw stack traces in error responses or logs.
- [x] 100% test coverage with mock provider in `src/features/ai/__tests__/gemini-provider.test.ts` and `src/app/api/assistant/__tests__/route.test.ts`.

## Verification
- Verified with 6 tests in `src/features/ai/__tests__/gemini-provider.test.ts` and 4 tests in `src/app/api/assistant/__tests__/route.test.ts`.
- Validated error mapping (503 MODEL_UNAVAILABLE, 429 QUOTA_EXCEEDED, 401 AUTH_ERROR, 400 VALIDATION_ERROR).
