import { CurrencyCode, EventType } from '../events/types';

export type AssistantIntent =
  | 'ideas'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'guests'
  | 'general';

export type ProposalActionType =
  | 'adjust_budget_allocation'
  | 'add_task'
  | 'add_milestone'
  | 'add_checklist_item'
  | 'suggest_vendor_followup'
  | 'update_preference';

export type ProposalStatus = 'staged' | 'accepted' | 'dismissed' | 'conflict';

export interface BudgetAdjustmentPayload {
  actionType: 'adjust_budget_allocation';
  categoryName: string;
  currentAllocated: number;
  proposedAllocated: number;
  rationale: string;
}

export interface AddTaskPayload {
  actionType: 'add_task';
  title: string;
  offsetDays: number;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  milestoneTitle?: string;
}

export interface AddMilestonePayload {
  actionType: 'add_milestone';
  title: string;
  offsetDays: number;
  description?: string;
}

export interface AddChecklistItemPayload {
  actionType: 'add_checklist_item';
  area: 'logistics' | 'vendor' | 'rsvp';
  itemText: string;
}

export interface SuggestVendorFollowupPayload {
  actionType: 'suggest_vendor_followup';
  vendorCategory: string;
  suggestedQuestions: string[];
  checklistNotes?: string;
}

export interface UpdatePreferencePayload {
  actionType: 'update_preference';
  category: 'priorities' | 'budget' | 'logistics' | 'tradition';
  field: string;
  currentValue?: unknown;
  proposedValue: unknown;
  provenance: 'explicit' | 'inferred';
  rationale: string;
  userEvidence?: string;
  conflictsWith?: string;
}

export type ProposalPayload =
  | BudgetAdjustmentPayload
  | AddTaskPayload
  | AddMilestonePayload
  | AddChecklistItemPayload
  | SuggestVendorFollowupPayload
  | UpdatePreferencePayload;

export interface StagedProposal {
  id: string;
  actionType: ProposalActionType;
  title: string;
  explanation: string;
  assumptions?: string;
  potentialImpact?: string;
  status: ProposalStatus;
  conflictReason?: string;
  payload: ProposalPayload;
}

export interface ProjectedEventContext {
  eventType: EventType;
  title: string;
  date: string;
  city?: string;
  currency: CurrencyCode;
  budgetCap: number;
  categorySummary?: { name: string; allocatedAmount: number }[];
  expectedAttendance?: number;
  culturalContext?: {
    traditionOrTheme?: string;
    notes?: string;
  };
  preferencesSummary?: {
    priorities?: string[];
    atmosphere?: string;
    budgetFlexibility?: string;
    spendingPriorities?: string[];
    nonNegotiables?: string[];
    dietaryStyle?: string;
    accessibility?: string[];
  };
}

export interface AiAssistantRequest {
  eventId: string;
  intent: AssistantIntent;
  userPrompt: string;
  context: ProjectedEventContext;
}

export interface AiAssistantResponse {
  answer: string;
  summary: string;
  recommendations: string[];
  proposals: StagedProposal[];
  modelUsed: string;
  provider?: 'cloudflare' | 'gemini';
  timestamp: string;
}
