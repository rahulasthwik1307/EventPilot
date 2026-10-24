import { z } from 'zod';

export const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const;
export const CURRENCY_CODES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export const AssistantIntentSchema = z.enum([
  'ideas',
  'budget',
  'timeline',
  'vendors',
  'guests',
  'general',
]);

export const ProjectedContextSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  city: z.string().optional(),
  currency: z.enum(CURRENCY_CODES),
  budgetCap: z.number().positive('Budget cap must be positive'),
  categorySummary: z
    .array(
      z.object({
        name: z.string().min(1),
        allocatedAmount: z.number().nonnegative(),
      })
    )
    .optional(),
  expectedAttendance: z.number().int().nonnegative().optional(),
  culturalContext: z
    .object({
      traditionOrTheme: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  preferencesSummary: z
    .object({
      priorities: z.array(z.string()).optional(),
      atmosphere: z.string().optional(),
      budgetFlexibility: z.string().optional(),
      spendingPriorities: z.array(z.string()).optional(),
      nonNegotiables: z.array(z.string()).optional(),
      dietaryStyle: z.string().optional(),
      accessibility: z.array(z.string()).optional(),
    })
    .optional(),
});

export const AiAssistantRequestSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  intent: AssistantIntentSchema,
  userPrompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(1000, 'Prompt exceeds maximum character length (1000)'),
  context: ProjectedContextSchema,
});

// Discriminated payload schemas
export const BudgetAdjustmentPayloadSchema = z.object({
  actionType: z.literal('adjust_budget_allocation'),
  categoryName: z.string().min(1),
  currentAllocated: z.number().nonnegative(),
  proposedAllocated: z.number().nonnegative(),
  rationale: z.string().min(1),
});

export const AddTaskPayloadSchema = z.object({
  actionType: z.literal('add_task'),
  title: z.string().min(1),
  offsetDays: z.number().int().min(-365).max(365),
  priority: z.enum(['low', 'medium', 'high']),
  description: z.string().optional(),
  milestoneTitle: z.string().optional(),
});

export const AddMilestonePayloadSchema = z.object({
  actionType: z.literal('add_milestone'),
  title: z.string().min(1),
  offsetDays: z.number().int().min(-365).max(365),
  description: z.string().optional(),
});

export const AddChecklistItemPayloadSchema = z.object({
  actionType: z.literal('add_checklist_item'),
  area: z.enum(['logistics', 'vendor', 'rsvp']),
  itemText: z.string().min(1),
});

export const SuggestVendorFollowupPayloadSchema = z.object({
  actionType: z.literal('suggest_vendor_followup'),
  vendorCategory: z.string().min(1),
  suggestedQuestions: z.array(z.string().min(1)).min(1),
  checklistNotes: z.string().optional(),
});

export const VALID_PREFERENCE_CATEGORIES = ['priorities', 'budget', 'logistics', 'tradition'] as const;

export const UpdatePreferencePayloadSchema = z
  .object({
    actionType: z.literal('update_preference'),
    category: z.enum(VALID_PREFERENCE_CATEGORIES),
    field: z.string().min(1),
    currentValue: z.unknown().optional(),
    proposedValue: z.unknown(),
    provenance: z.enum(['explicit', 'inferred']),
    rationale: z.string().min(1),
    userEvidence: z.string().optional(),
    conflictsWith: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { category, field, proposedValue } = data;

    // Reject undefined or null proposedValue
    if (proposedValue === undefined || proposedValue === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proposedValue'],
        message: 'proposedValue cannot be null or undefined',
      });
      return;
    }

    // Reject untrusted attempts to set internal provenance or confirmation metadata through model payloads
    if (typeof proposedValue === 'object' && proposedValue !== null) {
      const obj = proposedValue as Record<string, unknown>;
      if ('provenance' in obj || 'source' in obj || 'confidence' in obj) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['proposedValue'],
          message: 'Model payloads may not inject internal provenance or source metadata',
        });
        return;
      }
    }

    // Validate supported field and value per category
    if (category === 'budget') {
      const validBudgetFields = ['flexibility', 'spendingPriorities', 'economizeAreas', 'nonNegotiables', 'all'];
      if (!validBudgetFields.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['field'],
          message: `Unsupported field "${field}" for category "budget"`,
        });
        return;
      }

      if (field === 'flexibility') {
        const validFlex = ['strict_hard_limit', 'moderate_flexibility', 'flexible_target'];
        const val = typeof proposedValue === 'object' && proposedValue !== null && 'flexibility' in proposedValue
          ? (proposedValue as any).flexibility
          : proposedValue;
        if (!validFlex.includes(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: `Budget flexibility must be one of: ${validFlex.join(', ')}`,
          });
        }
      } else if (['spendingPriorities', 'economizeAreas', 'nonNegotiables'].includes(field)) {
        const val = typeof proposedValue === 'object' && proposedValue !== null && field in proposedValue
          ? (proposedValue as any)[field]
          : proposedValue;
        if (!Array.isArray(val) || !val.every((item) => typeof item === 'string')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: `${field} must be an array of strings`,
          });
        }
      }
    } else if (category === 'priorities') {
      const validPriorityFields = ['primaryFocus', 'atmosphere', 'experienceNotes', 'all'];
      if (!validPriorityFields.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['field'],
          message: `Unsupported field "${field}" for category "priorities"`,
        });
        return;
      }

      if (field === 'atmosphere') {
        const validAtmospheres = [
          'intimate_traditional',
          'grand_festive',
          'relaxed_contemporary',
          'minimalist_sacred',
          'vibrant_celebratory',
          'custom',
        ];
        const val = typeof proposedValue === 'object' && proposedValue !== null && 'atmosphere' in proposedValue
          ? (proposedValue as any).atmosphere
          : proposedValue;
        if (!validAtmospheres.includes(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: `Atmosphere must be one of: ${validAtmospheres.join(', ')}`,
          });
        }
      } else if (field === 'primaryFocus') {
        const val = typeof proposedValue === 'object' && proposedValue !== null && 'primaryFocus' in proposedValue
          ? (proposedValue as any).primaryFocus
          : proposedValue;
        if (!Array.isArray(val) || !val.every((item) => typeof item === 'string')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: 'primaryFocus must be an array of strings',
          });
        }
      }
    } else if (category === 'logistics') {
      const validLogisticsFields = ['guestCountFlexibility', 'accessibilityRequirements', 'venueTypePreference', 'timeOfDay', 'all'];
      if (!validLogisticsFields.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['field'],
          message: `Unsupported field "${field}" for category "logistics"`,
        });
        return;
      }

      if (field === 'guestCountFlexibility') {
        const validFlex = ['strict_cap', 'small_buffer', 'open_estimate'];
        const val = typeof proposedValue === 'object' && proposedValue !== null && 'guestCountFlexibility' in proposedValue
          ? (proposedValue as any).guestCountFlexibility
          : proposedValue;
        if (!validFlex.includes(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: `guestCountFlexibility must be one of: ${validFlex.join(', ')}`,
          });
        }
      } else if (field === 'accessibilityRequirements') {
        const val = typeof proposedValue === 'object' && proposedValue !== null && 'accessibilityRequirements' in proposedValue
          ? (proposedValue as any).accessibilityRequirements
          : proposedValue;
        if (!Array.isArray(val) || !val.every((item) => typeof item === 'string')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: 'accessibilityRequirements must be an array of strings',
          });
        }
      }
    } else if (category === 'tradition') {
      const validTraditionFields = ['dietaryStyle', 'musicStyle', 'customRequirements', 'notes', 'all'];
      if (!validTraditionFields.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['field'],
          message: `Unsupported field "${field}" for category "tradition"`,
        });
        return;
      }

      if (field === 'dietaryStyle') {
        const validDiet = ['pure_vegetarian', 'sattvic_jain', 'vegetarian_and_non_veg', 'multi_cuisine', 'custom'];
        const val = typeof proposedValue === 'object' && proposedValue !== null && 'dietaryStyle' in proposedValue
          ? (proposedValue as any).dietaryStyle
          : proposedValue;
        if (!validDiet.includes(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proposedValue'],
            message: `dietaryStyle must be one of: ${validDiet.join(', ')}`,
          });
        }
      }
    }
  });

export const ProposalPayloadSchema = z.discriminatedUnion('actionType', [
  BudgetAdjustmentPayloadSchema,
  AddTaskPayloadSchema,
  AddMilestonePayloadSchema,
  AddChecklistItemPayloadSchema,
  SuggestVendorFollowupPayloadSchema,
  UpdatePreferencePayloadSchema,
]);

export const ProposalActionTypeSchema = z.enum([
  'adjust_budget_allocation',
  'add_task',
  'add_milestone',
  'add_checklist_item',
  'suggest_vendor_followup',
  'update_preference',
]);

export const ProposalStatusSchema = z.enum([
  'staged',
  'accepted',
  'dismissed',
  'conflict',
]);

export const StagedProposalSchema = z.object({
  id: z.string().min(1),
  actionType: ProposalActionTypeSchema,
  title: z.string().min(1),
  explanation: z.string().min(1),
  assumptions: z.string().optional(),
  potentialImpact: z.string().optional(),
  status: ProposalStatusSchema.default('staged'),
  conflictReason: z.string().optional(),
  payload: ProposalPayloadSchema,
});

export const AiAssistantResponseSchema = z.object({
  answer: z.string().min(1),
  summary: z.string().min(1),
  recommendations: z.array(z.string()).default([]),
  proposals: z.array(StagedProposalSchema).default([]),
  modelUsed: z.string(),
  provider: z.enum(['cloudflare', 'gemini']).optional(),
  timestamp: z.string(),
});

/**
 * Raw output schema blueprint passed to Gemini structured output configuration.
 */
export const GEMINI_STRUCTURED_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    answer: {
      type: 'string',
      description: 'Clear, polite, culturally inclusive conversational response answering user prompt.',
    },
    summary: {
      type: 'string',
      description: 'One-line high-level takeaway.',
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Bullet points of practical advice, alternatives, or considerations.',
    },
    proposals: {
      type: 'array',
      description: 'Structured actionable changes staged for explicit human review.',
      items: {
        type: 'object',
        properties: {
          actionType: {
            type: 'string',
            enum: [
              'adjust_budget_allocation',
              'add_task',
              'add_milestone',
              'add_checklist_item',
              'suggest_vendor_followup',
              'update_preference',
            ],
          },
          title: { type: 'string', description: 'Brief human-readable proposal title.' },
          explanation: { type: 'string', description: 'Why this action is proposed.' },
          assumptions: { type: 'string', description: 'Any assumptions made.' },
          potentialImpact: { type: 'string', description: 'Expected outcome or impact.' },
          payload: {
            type: 'object',
            description: 'Action-specific payload matching the actionType.',
            properties: {
              actionType: { type: 'string' },
              categoryName: { type: 'string' },
              currentAllocated: { type: 'number' },
              proposedAllocated: { type: 'number' },
              rationale: { type: 'string' },
              title: { type: 'string' },
              offsetDays: { type: 'integer' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              description: { type: 'string' },
              milestoneTitle: { type: 'string' },
              area: { type: 'string', enum: ['logistics', 'vendor', 'rsvp'] },
              itemText: { type: 'string' },
              vendorCategory: { type: 'string' },
              suggestedQuestions: { type: 'array', items: { type: 'string' } },
              checklistNotes: { type: 'string' },
              category: { type: 'string', enum: ['priorities', 'budget', 'logistics', 'tradition'] },
              field: { type: 'string' },
              proposedValue: { type: 'object' },
              provenance: { type: 'string', enum: ['explicit', 'inferred'] },
              userEvidence: { type: 'string' },
            },
            required: ['actionType'],
          },
        },
        required: ['actionType', 'title', 'explanation', 'payload'],
      },
    },
  },
  required: ['answer', 'summary', 'recommendations', 'proposals'],
};
