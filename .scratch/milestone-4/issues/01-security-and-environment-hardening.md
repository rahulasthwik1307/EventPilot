# 01: Security & Environment Hardening

**Status:** closed  
**Blocked by:** None

## What to build
Ensure strict secret isolation for Google Gemini API credentials.

## Acceptance Criteria
- [x] Real API key is strictly stored in `.env.local` and never committed.
- [x] `.env.example` contains only safe placeholders (`your_gemini_api_key_here`).
- [x] `.env.local` is matched by `.gitignore` and verified by `git check-ignore`.
- [x] Key is read only server-side via `process.env.GEMINI_API_KEY`.
- [x] No `NEXT_PUBLIC_GEMINI_API_KEY` exists or is created.
- [x] Secrets are never included in client bundles, URLs, error responses, logs, or diagnostic dumps.

## Verification
- Confirmed `.env.local` is ignored (`git check-ignore .env.local`).
- Verified via `git diff HEAD .env.example` that the real secret was never committed to git history.
- Verified client code only makes requests to server-side `/api/assistant`.
