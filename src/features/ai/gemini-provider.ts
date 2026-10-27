import { GoogleGenAI } from '@google/genai';
import {
  AiAssistantRequest,
  AiAssistantResponse,
  StagedProposal,
} from './types';
import {
  AiAssistantResponseSchema,
  GEMINI_STRUCTURED_RESPONSE_SCHEMA,
} from './schemas';

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

export const SYSTEM_INSTRUCTION = `You are Event Pilot's AI Celebration Planning Assistant.
You provide calm, practical, culturally inclusive event planning assistance for celebrations (weddings/vivaha, milestone birthdays, community festivals) in India and across global communities.
Respect diverse traditions (South Indian, North Indian, Jain, Halal, secular, contemporary). Never impose a specific ritual, religion, or tradition unless requested by the user.
Provide clear, actionable, high-clarity advice and concrete proposals staged for human review.
Never fabricate real vendor contact numbers, emails, or live pricing quotes.
Keep proposals structured, safe, and realistic. Always output valid JSON strictly matching the requested schema.`;

/**
 * Builds the user prompt containing user question and minimal allowlisted context.
 */
export function buildPrompt(request: AiAssistantRequest): string {
  const { intent, userPrompt, context } = request;

  let contextDescription = `Event Archetype: ${context.eventType}\nCelebration Title: ${context.title}\nCelebration Date: ${context.date}\nCurrency: ${context.currency}\nBudget Cap: ${context.budgetCap}`;

  if (context.city) {
    contextDescription += `\nCity / Region: ${context.city}`;
  }

  if (context.culturalContext?.traditionOrTheme) {
    contextDescription += `\nTheme / Cultural Context: ${context.culturalContext.traditionOrTheme}`;
  }
  if (context.culturalContext?.notes) {
    contextDescription += `\nPlanning Notes: ${context.culturalContext.notes}`;
  }

  if (context.categorySummary && context.categorySummary.length > 0) {
    contextDescription += `\nAllocated Budget Categories:\n${context.categorySummary
      .map((c) => `- ${c.name}: ${c.allocatedAmount}`)
      .join('\n')}`;
  }

  if (context.expectedAttendance !== undefined) {
    contextDescription += `\nExpected Confirmed Attendance: ${context.expectedAttendance} attendees`;
  }

  if (context.preferencesSummary) {
    const ps = context.preferencesSummary;
    const prefLines: string[] = [];
    if (ps.atmosphere) prefLines.push(`- Atmosphere: ${ps.atmosphere}`);
    if (ps.budgetFlexibility) prefLines.push(`- Budget Flexibility: ${ps.budgetFlexibility}`);
    if (ps.spendingPriorities?.length) prefLines.push(`- Spending Priorities: ${ps.spendingPriorities.join(', ')}`);
    if (ps.nonNegotiables?.length) prefLines.push(`- Non-Negotiables: ${ps.nonNegotiables.join(', ')}`);
    if (ps.dietaryStyle) prefLines.push(`- Dietary Style: ${ps.dietaryStyle}`);
    if (ps.accessibility?.length) prefLines.push(`- Accessibility: ${ps.accessibility.join(', ')}`);
    if (prefLines.length > 0) {
      contextDescription += `\nConfirmed Preferences:\n${prefLines.join('\n')}`;
    }
  }

  return `Intent: ${intent}\n\nEvent Context:\n${contextDescription}\n\nUser Question:\n"${userPrompt}"\n\nPlease provide a clear answer, summary, practical recommendation bullet points, and any relevant staged proposals (budget adjustment, timeline task, milestone, vendor checklist, or update preference).`;
}

/**
 * Invokes Gemini 3.8 Flash to generate structured event planning recommendations.
 */
export async function generateAssistantResponse(
  request: AiAssistantRequest,
  clientOverride?: GoogleGenAI
): Promise<ProviderResult<AiAssistantResponse>> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';

  if (!apiKey && !clientOverride) {
    return {
      success: false,
      error: {
        code: 'CONFIG_MISSING',
        message: 'Gemini API key is not configured. Please verify GEMINI_API_KEY in .env.local.',
        status: 500,
      },
    };
  }

  try {
    const ai = clientOverride || new GoogleGenAI({ apiKey });
    const promptText = buildPrompt(request);

    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_STRUCTURED_RESPONSE_SCHEMA,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return {
        success: false,
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'The model returned an empty response. Please try again.',
          status: 502,
        },
      };
    }

    let parsedJson: Record<string, unknown>;
    try {
      parsedJson = JSON.parse(rawText);
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

    // Assign stable proposal IDs if not present and ensure status is 'staged'
    const rawProposals = Array.isArray(parsedJson.proposals) ? (parsedJson.proposals as Record<string, unknown>[]) : [];
    const proposals: StagedProposal[] = rawProposals.map((p, idx: number) => ({
      id: `prop-${Date.now()}-${idx + 1}`,
      actionType: p.actionType as StagedProposal['actionType'],
      title: typeof p.title === 'string' ? p.title : 'Untitled Proposal',
      explanation: typeof p.explanation === 'string' ? p.explanation : '',
      assumptions: typeof p.assumptions === 'string' ? p.assumptions : undefined,
      potentialImpact: typeof p.potentialImpact === 'string' ? p.potentialImpact : undefined,
      status: 'staged',
      payload: (p.payload || p) as StagedProposal['payload'],
    }));

    const responsePayload: AiAssistantResponse = {
      answer: typeof parsedJson.answer === 'string' ? parsedJson.answer : '',
      summary: typeof parsedJson.summary === 'string' ? parsedJson.summary : '',
      recommendations: Array.isArray(parsedJson.recommendations) ? (parsedJson.recommendations as string[]) : [],
      proposals,
      modelUsed: model,
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
    const errorMsg = err instanceof Error ? err.message : String(err || '');

    if (errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('high demand')) {
      return {
        success: false,
        error: {
          code: 'MODEL_UNAVAILABLE',
          message:
            'Gemini 3.8 Flash is currently experiencing high demand. Spikes in demand are temporary; please retry in a moment.',
          status: 503,
        },
      };
    }

    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      return {
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'AI request quota temporarily reached. Please wait a moment before trying again.',
          status: 429,
        },
      };
    }

    if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('API_KEY_INVALID')) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed. Please verify the Gemini API key in your configuration.',
          status: 401,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: 'Failed to communicate with AI Assistant services. Please try again.',
        status: 500,
      },
    };
  }
}
