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

export const ProposalPayloadSchema = z.discriminatedUnion('actionType', [
  BudgetAdjustmentPayloadSchema,
  AddTaskPayloadSchema,
  AddMilestonePayloadSchema,
  AddChecklistItemPayloadSchema,
  SuggestVendorFollowupPayloadSchema,
]);

export const ProposalActionTypeSchema = z.enum([
  'adjust_budget_allocation',
  'add_task',
  'add_milestone',
  'add_checklist_item',
  'suggest_vendor_followup',
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
