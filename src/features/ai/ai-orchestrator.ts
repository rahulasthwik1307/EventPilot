import {
  AiAssistantRequest,
  AiAssistantResponse,
} from './types';
import {
  generateAssistantResponse as generateGeminiAssistantResponse,
  ProviderResult,
} from './gemini-provider';
import {
  generateCloudflareAssistantResponse,
  isVerifiedFreeModel,
  VERIFIED_FREE_CLOUDFLARE_MODELS,
  VerifiedCloudflareModel,
} from './cloudflare-provider';

export interface OrchestratorOptions {
  cloudflareModels?: readonly string[];
  maxRetriesPerModel?: number;
  retryDelayMs?: number;
  cfInvocationFn?: typeof generateCloudflareAssistantResponse;
  geminiInvocationFn?: typeof generateGeminiAssistantResponse;
  clientOverride?: any;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  allowGeminiFallback?: boolean;
  maxTotalAttempts?: number;
}

/**
 * Resolves the configured list of Cloudflare models, strictly enforcing
 * that only verified free-tier models are ever attempted.
 */
export function getActiveCloudflareModels(
  customModels?: readonly string[]
): VerifiedCloudflareModel[] {
  const envConfig = process.env.CLOUDFLARE_MODELS?.trim();
  let candidateList: readonly string[];

  if (customModels && customModels.length > 0) {
    candidateList = customModels;
  } else if (envConfig) {
    candidateList = envConfig.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    candidateList = VERIFIED_FREE_CLOUDFLARE_MODELS;
  }

  // Strict enforcement: filter out any unverified or paid models
  const verifiedList = candidateList.filter((m): m is VerifiedCloudflareModel =>
    isVerifiedFreeModel(m)
  );

  return verifiedList.length > 0
    ? verifiedList
    : [...VERIFIED_FREE_CLOUDFLARE_MODELS];
}

/**
 * Orchestrates multi-model AI generation adhering to strict priority:
 * 1. Cloudflare Workers AI primary verified free model.
 * 2. Next eligible free Cloudflare model upon failure.
 * 3. Gemini Flash as the final fallback provider once Cloudflare candidates are exhausted.
 * 4. Safe actionable error response if all providers fail.
 */
export async function orchestrateAssistantResponse(
  request: AiAssistantRequest,
  options: OrchestratorOptions = {}
): Promise<ProviderResult<AiAssistantResponse>> {
  const models = getActiveCloudflareModels(options.cloudflareModels);
  const maxRetries = options.maxRetriesPerModel ?? 1;
  const retryDelay = options.retryDelayMs ?? 200;
  const invokeCloudflare =
    options.cfInvocationFn || generateCloudflareAssistantResponse;
  const invokeGemini =
    options.geminiInvocationFn || generateGeminiAssistantResponse;

  const maxTotalAttempts =
    options.maxTotalAttempts ?? (Number(process.env.MAX_AI_PROVIDER_ATTEMPTS) || 4);
  const allowGeminiFallback =
    options.allowGeminiFallback ?? (process.env.ENABLE_GEMINI_FALLBACK !== 'false');

  let totalAttempts = 0;

  const failureLog: Array<{ provider: string; model: string; code: string; message: string }> = [];

  // Phase 1: Cloudflare Workers AI Multi-Model Chain
  for (let i = 0; i < models.length; i++) {
    if (totalAttempts >= maxTotalAttempts) {
      break;
    }
    const model = models[i];
    let attempt = 0;

    while (attempt <= maxRetries && totalAttempts < maxTotalAttempts) {
      attempt++;
      totalAttempts++;

      const result = await invokeCloudflare(request, model, {
        timeoutMs: options.timeoutMs,
        fetchFn: options.fetchFn,
      });

      if (result.success && result.data) {
        // Primary or secondary Cloudflare model succeeded — Gemini is NEVER called.
        return {
          success: true,
          data: {
            ...result.data,
            provider: 'cloudflare',
          },
        };
      }

      const err = result.error || {
        code: 'UNKNOWN_FAILURE',
        message: 'Cloudflare invocation failed.',
        status: 500,
      };

      failureLog.push({
        provider: 'cloudflare',
        model,
        code: err.code,
        message: err.message,
      });

      // 401 Auth errors mean credentials are invalid for all Cloudflare calls.
      // Break directly to Gemini fallback rather than failing identically on every model.
      if (err.code === 'AUTH_ERROR') {
        break;
      }

      // Non-retryable model errors: quota exhausted, paid plan required, or validation failed.
      // Advance immediately to next model in the chain without retrying the same model.
      if (
        err.code === 'PAID_MODEL_BLOCKED' ||
        err.code === 'QUOTA_EXCEEDED' ||
        err.code === 'INVALID_JSON' ||
        err.code === 'SCHEMA_VALIDATION_FAILED' ||
        err.code === 'TIMEOUT'
      ) {
        break;
      }

      // Transient errors (capacity 429 or 5xx server errors): retry up to maxRetries
      if (attempt <= maxRetries && (err.code === 'CAPACITY_EXCEEDED' || err.code === 'SERVER_ERROR')) {
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        continue;
      }

      break;
    }

    if (failureLog.some((f) => f.code === 'AUTH_ERROR')) {
      break;
    }
  }

  // Phase 2: Final Fallback to existing Gemini implementation (when permitted and within attempt budget)
  const shouldAttemptGemini = allowGeminiFallback && totalAttempts < maxTotalAttempts;

  if (shouldAttemptGemini) {
    totalAttempts++;
  try {
    const geminiResult = await invokeGemini(request, options.clientOverride);

    if (geminiResult.success && geminiResult.data) {
      return {
        success: true,
        data: {
          ...geminiResult.data,
          provider: 'gemini',
        },
      };
    }

    const geminiErr = geminiResult.error || {
      code: 'GEMINI_FAILURE',
      message: 'Gemini fallback failed.',
      status: 503,
    };

    failureLog.push({
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      code: geminiErr.code,
      message: geminiErr.message,
    });
  } catch (geminiCatchErr: any) {
    failureLog.push({
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      code: 'GEMINI_EXCEPTION',
      message: geminiCatchErr?.message || 'Gemini threw an unexpected exception.',
    });
  }

  }

  // Phase 3: All providers exhausted — return safe, actionable user error
  const lastFailure = failureLog[failureLog.length - 1];
  const isHighDemand = failureLog.some(
    (f) =>
      f.code === 'MODEL_UNAVAILABLE' ||
      f.code === 'SERVER_ERROR' ||
      f.code === 'CAPACITY_EXCEEDED'
  );
  const isQuota = failureLog.length > 0 && failureLog.every((f) => f.code === 'QUOTA_EXCEEDED');

  if (isQuota) {
    return {
      success: false,
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'AI request limits temporarily reached across available providers. Please retry in a few moments.',
        status: 429,
      },
    };
  }

  return {
    success: false,
    error: {
      code: isHighDemand ? 'MODEL_UNAVAILABLE' : 'SERVICE_UNAVAILABLE',
      message:
        'AI Planning Assistant services are currently experiencing high demand. Please try submitting your request again in a moment.',
      status: 503,
    },
  };
}
