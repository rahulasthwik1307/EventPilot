import {
  AiAssistantRequest,
  AiAssistantResponse,
  ProposalPayload,
  StagedProposal,
} from './types';
import { AiAssistantResponseSchema, StagedProposalSchema } from './schemas';
import {
  buildPrompt,
  ProviderResult,
  SYSTEM_INSTRUCTION,
} from './gemini-provider';

/**
 * Explicit ordered list of verified free-eligible Cloudflare Workers AI models.
 * Verified against live Cloudflare catalog and official free 10,000 Neurons/day tier on 2026-10-22.
 * Models requiring paid Workers plan possess 'require_workers_paid: true' and are strictly excluded.
 */
export const VERIFIED_FREE_CLOUDFLARE_MODELS = [
  '@cf/meta/llama-3.2-3b-instruct',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
] as const;

export type VerifiedCloudflareModel =
  (typeof VERIFIED_FREE_CLOUDFLARE_MODELS)[number];

/**
 * Type guard verifying whether a model ID belongs to the verified free-tier Cloudflare model whitelist.
 *
 * @param modelId - The identifier of the model to test.
 * @returns True if the model is in the verified free-tier whitelist, false otherwise.
 */
export function isVerifiedFreeModel(
  modelId: string
): modelId is VerifiedCloudflareModel {
  return (VERIFIED_FREE_CLOUDFLARE_MODELS as readonly string[]).includes(
    modelId as VerifiedCloudflareModel
  );
}

export interface CloudflareInvocationOptions {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  credentials?: {
    accountId?: string;
    apiToken?: string;
  };
}

export const CLOUDFLARE_SYSTEM_INSTRUCTION = `${SYSTEM_INSTRUCTION}

You MUST output ONLY a valid raw JSON object strictly conforming to this schema blueprint:
{
  "answer": "string (calm, culturally attuned conversational answer)",
  "summary": "string (one-line takeaway)",
  "recommendations": ["string (practical advice bullet)"],
  "proposals": [
    {
      "actionType": "adjust_budget_allocation",
      "title": "string",
      "explanation": "string",
      "payload": {
        "actionType": "adjust_budget_allocation",
        "categoryName": "string",
        "currentAllocated": number,
        "proposedAllocated": number,
        "rationale": "string"
      }
    },
    {
      "actionType": "add_task",
      "title": "string",
      "explanation": "string",
      "payload": {
        "actionType": "add_task",
        "title": "string",
        "offsetDays": number (negative integer for days before celebration, e.g. -30),
        "priority": "low" | "medium" | "high",
        "description": "string"
      }
    },
    {
      "actionType": "add_milestone",
      "title": "string",
      "explanation": "string",
      "payload": {
        "actionType": "add_milestone",
        "title": "string",
        "offsetDays": number (negative integer, e.g. -14),
        "description": "string"
      }
    },
    {
      "actionType": "add_checklist_item",
      "title": "string",
      "explanation": "string",
      "payload": {
        "actionType": "add_checklist_item",
        "area": "logistics" | "vendor" | "rsvp",
        "itemText": "string"
      }
    },
    {
      "actionType": "suggest_vendor_followup",
      "title": "string",
      "explanation": "string",
      "payload": {
        "actionType": "suggest_vendor_followup",
        "vendorCategory": "string",
        "suggestedQuestions": ["string"],
        "checklistNotes": "string"
      }
    },
    {
      "actionType": "update_preference",
      "title": "string",
      "explanation": "string",
      "payload": {
        "actionType": "update_preference",
        "category": "priorities" | "budget" | "logistics" | "tradition",
        "field": "string",
        "proposedValue": {},
        "provenance": "explicit" | "inferred",
        "rationale": "string",
        "userEvidence": "string"
      }
    }
  ]
}

CRITICAL RULES:
1. Every proposal MUST have a valid "actionType" matching one of: 'adjust_budget_allocation', 'add_task', 'add_milestone', 'add_checklist_item', 'suggest_vendor_followup', 'update_preference'.
2. The proposal's "payload" object MUST contain "actionType" identical to the proposal's actionType.
3. Output strictly valid JSON without markdown formatting backticks.`;

/**
 * Normalizes raw model proposal output into a strictly validated StagedProposal.
 * Recovers slightly unaligned keys (e.g. nested budget_allocation or missing actionType inside payload).
 */
export function normalizeStagedProposal(p: unknown, idx: number): StagedProposal | null {
  if (!p || typeof p !== 'object') return null;

  const rawObj = p as Record<string, unknown>;
  const actionType = String(
    rawObj.actionType ||
      (typeof rawObj.payload === 'object' && rawObj.payload !== null
        ? (rawObj.payload as Record<string, unknown>).actionType
        : '') ||
      ''
  );
  if (!actionType) return null;

  const rawPayload = (
    typeof rawObj.payload === 'object' && rawObj.payload !== null ? rawObj.payload : p
  ) as Record<string, unknown>;
  let normalizedPayload: ProposalPayload | null = null;

  if (actionType === 'adjust_budget_allocation') {
    const catName =
      rawPayload.categoryName ||
      (rawPayload.budget_allocation ? Object.keys(rawPayload.budget_allocation)[0] : '') ||
      'Venue & Banquets';

    const proposed =
      typeof rawPayload.proposedAllocated === 'number'
        ? rawPayload.proposedAllocated
        : rawPayload.budget_allocation
        ? Object.values(rawPayload.budget_allocation)[0]
        : 0;

    const current =
      typeof rawPayload.currentAllocated === 'number' ? rawPayload.currentAllocated : 0;

    normalizedPayload = {
      actionType: 'adjust_budget_allocation',
      categoryName: String(catName || 'General Allocation'),
      currentAllocated: Math.max(0, Number(current) || 0),
      proposedAllocated: Math.max(0, Number(proposed) || 0),
      rationale: String(rawPayload.rationale || rawObj.explanation || 'Budget adjustment proposal'),
    };
  } else if (actionType === 'add_task') {
    const rawOffset =
      typeof rawPayload.offsetDays === 'number'
        ? rawPayload.offsetDays
        : -30;
    const clampedOffset = Math.max(-365, Math.min(365, Math.round(Number(rawOffset) || -30)));

    normalizedPayload = {
      actionType: 'add_task',
      title: String(rawPayload.title || rawObj.title || 'Follow up on event milestone'),
      offsetDays: clampedOffset,
      priority:
        typeof rawPayload.priority === 'string' && ['low', 'medium', 'high'].includes(rawPayload.priority)
          ? (rawPayload.priority as 'low' | 'medium' | 'high')
          : 'medium',
      description: typeof rawPayload.description === 'string' ? rawPayload.description : typeof rawObj.explanation === 'string' ? rawObj.explanation : undefined,
      milestoneTitle: typeof rawPayload.milestoneTitle === 'string' ? rawPayload.milestoneTitle : undefined,
    };
  } else if (actionType === 'add_milestone') {
    const rawOffset =
      typeof rawPayload.offsetDays === 'number'
        ? rawPayload.offsetDays
        : -14;
    const clampedOffset = Math.max(-365, Math.min(365, Math.round(Number(rawOffset) || -14)));

    normalizedPayload = {
      actionType: 'add_milestone',
      title: String(rawPayload.title || rawObj.title || 'Key Celebration Milestone'),
      offsetDays: clampedOffset,
      description: typeof rawPayload.description === 'string' ? rawPayload.description : typeof rawObj.explanation === 'string' ? rawObj.explanation : undefined,
    };
  } else if (actionType === 'add_checklist_item') {
    normalizedPayload = {
      actionType: 'add_checklist_item',
      area:
        typeof rawPayload.area === 'string' && ['logistics', 'vendor', 'rsvp'].includes(rawPayload.area)
          ? (rawPayload.area as 'logistics' | 'vendor' | 'rsvp')
          : 'logistics',
      itemText: String(rawPayload.itemText || rawObj.title || 'Review arrangements'),
    };
  } else if (actionType === 'suggest_vendor_followup') {
    const questions =
      Array.isArray(rawPayload.suggestedQuestions) && rawPayload.suggestedQuestions.length > 0
        ? rawPayload.suggestedQuestions.map(String)
        : [String(rawObj.explanation || 'Confirm schedule, team size, and setup requirements')];

    normalizedPayload = {
      actionType: 'suggest_vendor_followup',
      vendorCategory: String(rawPayload.vendorCategory || 'Catering & Dining'),
      suggestedQuestions: questions,
      checklistNotes: typeof rawPayload.checklistNotes === 'string' ? rawPayload.checklistNotes : undefined,
    };
  } else if (actionType === 'update_preference') {
    const validCategories = ['priorities', 'budget', 'logistics', 'tradition'] as const;
    const category =
      typeof rawPayload.category === 'string' && (validCategories as readonly string[]).includes(rawPayload.category)
        ? (rawPayload.category as (typeof validCategories)[number])
        : null;
    if (!category) {
      return null;
    }

    const field = String(rawPayload.field || '').trim();
    if (!field || rawPayload.proposedValue === undefined) {
      return null;
    }

    normalizedPayload = {
      actionType: 'update_preference',
      category,
      field,
      currentValue: rawPayload.currentValue,
      proposedValue: rawPayload.proposedValue,
      provenance: 'inferred', // Model-supplied provenance is untrusted; always inferred
      rationale: String(rawPayload.rationale || rawObj.explanation || 'Refined preference recommendation'),
      userEvidence: typeof rawPayload.userEvidence === 'string' ? rawPayload.userEvidence : undefined,
      conflictsWith: typeof rawPayload.conflictsWith === 'string' ? rawPayload.conflictsWith : undefined,
    };
  }

  if (!normalizedPayload) return null;

  const candidate = {
    id: `prop-${Date.now()}-${idx + 1}`,
    actionType,
    title: String(rawObj.title || 'Staged Planning Change'),
    explanation: String(rawObj.explanation || 'Suggested adjustment based on event context.'),
    assumptions: typeof rawObj.assumptions === 'string' ? rawObj.assumptions : undefined,
    potentialImpact: typeof rawObj.potentialImpact === 'string' ? rawObj.potentialImpact : undefined,
    status: 'staged' as const,
    payload: normalizedPayload,
  };

  const parsed = StagedProposalSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Extracts response text from Cloudflare's dual response formats:
 * - standard text generation: { result: { response: "..." } }
 * - chat completion format: { result: { choices: [{ message: { content: "..." } }] } }
 */
export function extractCloudflareContent(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const res = result as {
    response?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (typeof res.response === 'string' && res.response.trim().length > 0) {
    return res.response;
  }

  if (Array.isArray(res.choices) && res.choices.length > 0) {
    const firstChoice = res.choices[0];
    if (typeof firstChoice?.message?.content === 'string') {
      return firstChoice.message.content;
    }
  }

  return null;
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) from raw model output.
 */
export function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Invokes a verified free-tier Cloudflare Workers AI model via the official REST API.
 */
export async function generateCloudflareAssistantResponse(
  request: AiAssistantRequest,
  modelId: string = VERIFIED_FREE_CLOUDFLARE_MODELS[0],
  options: CloudflareInvocationOptions = {}
): Promise<ProviderResult<AiAssistantResponse>> {
  const accountId = options.credentials?.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = options.credentials?.apiToken ?? process.env.CLOUDFLARE_API_TOKEN?.trim();
  const activeFetch = options.fetchFn || fetch;
  const timeoutMs = options.timeoutMs ?? (Number(process.env.CLOUDFLARE_TIMEOUT_MS) || 30000);

  // 1. Guard against non-free or unverified models
  if (!isVerifiedFreeModel(modelId)) {
    return {
      success: false,
      error: {
        code: 'PAID_MODEL_BLOCKED',
        message: `Model "${modelId}" is not verified as free-tier eligible. In accordance with strict free-tier policy, only verified free models may be invoked.`,
        status: 403,
      },
    };
  }

  // 2. Validate server-side credentials
  if (!accountId || !apiToken) {
    return {
      success: false,
      error: {
        code: 'CONFIG_MISSING',
        message:
          'Cloudflare credentials missing. Ensure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are configured in .env.local.',
        status: 500,
      },
    };
  }

  const endpointUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`;
  const promptText = buildPrompt(request);

  const payload = {
    messages: [
      {
        role: 'system',
        content: CLOUDFLARE_SYSTEM_INSTRUCTION,
      },
      {
        role: 'user',
        content: promptText,
      },
    ],
    max_tokens: 1024,
  };

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await activeFetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    let jsonResponse: {
      success?: boolean;
      errors?: Array<{ code?: number; message?: string }>;
      result?: unknown;
    };
    try {
      jsonResponse = (await response.json()) as typeof jsonResponse;
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: `Cloudflare Workers AI returned an unparseable response (HTTP ${response.status}).`,
          status: response.status >= 500 ? response.status : 502,
        },
      };
    }

    // Handle Cloudflare-level errors
    if (!response.ok || !jsonResponse.success) {
      const errors = Array.isArray(jsonResponse.errors) ? jsonResponse.errors : [];
      const primaryError = errors[0] || {};
      const errorCode = primaryError.code;
      const errorMsg = String(primaryError.message || primaryError || '');

      // 401 / Authentication failure
      if (response.status === 401 || errorCode === 10000 || /unauthorized|authentication/i.test(errorMsg)) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication failed for Cloudflare Workers AI. Verify your API token.',
            status: 401,
          },
        };
      }

      // 403 / Paid model required
      if (
        response.status === 403 ||
        errorCode === 5035 ||
        /Workers Free plan|require_workers_paid|Upgrade to access/i.test(errorMsg)
      ) {
        return {
          success: false,
          error: {
            code: 'PAID_MODEL_BLOCKED',
            message: `Model "${modelId}" requires a paid Cloudflare Workers plan and cannot be executed under free tier.`,
            status: 403,
          },
        };
      }

      // 429 / Quota or capacity
      if (response.status === 429) {
        if (errorCode === 3036 || /10,?000 neurons|daily free allocation/i.test(errorMsg)) {
          return {
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: 'Daily Cloudflare Workers AI free neuron allocation reached.',
              status: 429,
            },
          };
        }
        return {
          success: false,
          error: {
            code: 'CAPACITY_EXCEEDED',
            message: 'Cloudflare Workers AI capacity temporarily exceeded.',
            status: 429,
          },
        };
      }

      // 5xx / Temporary server errors
      if (response.status >= 500 || errorCode === 3040) {
        return {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: `Cloudflare Workers AI returned temporary server error (${response.status}).`,
            status: response.status >= 500 ? response.status : 503,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: errorMsg || 'Cloudflare Workers AI generation failed.',
          status: response.status || 500,
        },
      };
    }

    const rawContent = extractCloudflareContent(jsonResponse.result);
    if (!rawContent) {
      return {
        success: false,
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'The model returned an empty response. Please try again.',
          status: 502,
        },
      };
    }

    const cleanedContent = cleanJsonOutput(rawContent);

    let parsedJson: Record<string, unknown>;
    try {
      parsedJson = JSON.parse(cleanedContent) as Record<string, unknown>;
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'The model returned malformed output that could not be parsed.',
          status: 502,
        },
      };
    }

    // Assign stable proposal IDs and stage them with schema normalization
    const rawProposals = Array.isArray(parsedJson.proposals) ? (parsedJson.proposals as unknown[]) : [];
    const proposals: StagedProposal[] = rawProposals
      .map((p: unknown, idx: number) => normalizeStagedProposal(p, idx))
      .filter((p: StagedProposal | null): p is StagedProposal => p !== null);

    const responsePayload: AiAssistantResponse = {
      answer: typeof parsedJson.answer === 'string' ? parsedJson.answer : '',
      summary: typeof parsedJson.summary === 'string' ? parsedJson.summary : '',
      recommendations: Array.isArray(parsedJson.recommendations) ? (parsedJson.recommendations as string[]) : [],
      proposals,
      modelUsed: modelId,
      provider: 'cloudflare',
      timestamp: new Date().toISOString(),
    };

    const validated = AiAssistantResponseSchema.safeParse(responsePayload);
    if (!validated.success) {
      return {
        success: false,
        error: {
          code: 'SCHEMA_VALIDATION_FAILED',
          message: 'Model response failed validation against the proposal schema.',
          status: 502,
        },
      };
    }

    return {
      success: true,
      data: validated.data,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutTimer);

    const isAbort =
      (err instanceof Error && err.name === 'AbortError') ||
      /aborted|timeout/i.test(err instanceof Error ? err.message : String(err));
    if (isAbort) {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: `Request to Cloudflare model "${modelId}" timed out after ${timeoutMs}ms.`,
          status: 504,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error communicating with Cloudflare Workers AI.',
        status: 502,
      },
    };
  }
}
