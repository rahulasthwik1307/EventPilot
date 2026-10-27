import { ChecklistTask, Event, TimelineMilestone } from '../events/types';
import { calculateMilestoneDate } from '../events/timeline-engine';
import {
  AddChecklistItemPayload,
  AddMilestonePayload,
  AddTaskPayload,
  BudgetAdjustmentPayload,
  StagedProposal,
  SuggestVendorFollowupPayload,
  UpdatePreferencePayload,
} from './types';
import {
  createDefaultPreferenceRecord,
  createEmptyPreferences,
  detectPreferenceConflict,
  mergePreferences,
  mergeSinglePreferenceField,
} from '../preferences/preferences';

export type DiscriminatedStagedProposal =
  | (Omit<StagedProposal, 'actionType' | 'payload'> & {
      actionType: 'adjust_budget_allocation';
      payload: BudgetAdjustmentPayload;
    })
  | (Omit<StagedProposal, 'actionType' | 'payload'> & {
      actionType: 'add_task';
      payload: AddTaskPayload;
    })
  | (Omit<StagedProposal, 'actionType' | 'payload'> & {
      actionType: 'add_milestone';
      payload: AddMilestonePayload;
    })
  | (Omit<StagedProposal, 'actionType' | 'payload'> & {
      actionType: 'add_checklist_item';
      payload: AddChecklistItemPayload;
    })
  | (Omit<StagedProposal, 'actionType' | 'payload'> & {
      actionType: 'suggest_vendor_followup';
      payload: SuggestVendorFollowupPayload;
    })
  | (Omit<StagedProposal, 'actionType' | 'payload'> & {
      actionType: 'update_preference';
      payload: UpdatePreferencePayload;
    });

/**
 * Type guard verifying if a proposal has a recognized actionType for discriminated narrowing.
 *
 * @param p - The staged proposal candidate.
 * @returns True if the proposal matches one of the discriminated proposal union members.
 */
export function isDiscriminatedProposal(p: StagedProposal): p is DiscriminatedStagedProposal {
  return (
    p.actionType === 'adjust_budget_allocation' ||
    p.actionType === 'add_task' ||
    p.actionType === 'add_milestone' ||
    p.actionType === 'add_checklist_item' ||
    p.actionType === 'suggest_vendor_followup' ||
    p.actionType === 'update_preference'
  );
}

export interface ApplyProposalResult {
  success: boolean;
  event: Event;
  error?: string;
}

/**
 * Revalidates staged proposals against the current event state and marks any conflicting
 * or obsolete proposals (e.g. if a category referenced by a proposal was deleted by the user).
 */
/**
 * Resolves a category index by exact match or unambiguous partial/token match.
 */
export function findMatchingCategoryIndex(
  categories: { name: string }[],
  targetName: string
): number {
  if (!categories || !targetName) return -1;
  const cleanTarget = targetName.trim().toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact = categories.findIndex(
    (c) => c.name.trim().toLowerCase() === cleanTarget
  );
  if (exact !== -1) return exact;

  // 2. Substring match
  const subMatches = categories
    .map((c, idx) => ({ idx, name: c.name.toLowerCase() }))
    .filter((c) => c.name.includes(cleanTarget) || cleanTarget.includes(c.name));
  if (subMatches.length === 1) return subMatches[0].idx;

  // 3. Significant word intersection (tokens with length >= 4)
  const targetWords = cleanTarget
    .split(/[\s,&/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);

  const wordMatches = categories
    .map((c, idx) => {
      const catWords = c.name
        .toLowerCase()
        .split(/[\s,&/]+/)
        .map((w) => w.trim());
      const hasMatch = targetWords.some((tw) => catWords.includes(tw));
      return { idx, hasMatch };
    })
    .filter((m) => m.hasMatch);

  if (wordMatches.length === 1) return wordMatches[0].idx;

  return -1;
}

/**
 * Revalidates staged proposals against the live event state and annotates any conflicting or invalid proposals.
 *
 * @param event - The current live celebration event state.
 * @param proposals - The array of staged proposals to inspect.
 * @returns An updated array of proposals with conflict flags and warnings populated.
 */
export function detectProposalConflicts(
  event: Event,
  proposals: StagedProposal[]
): StagedProposal[] {
  return proposals.map((rawProposal) => {
    if (rawProposal.status !== 'staged') {
      return rawProposal;
    }

    if (!isDiscriminatedProposal(rawProposal)) {
      return rawProposal;
    }

    const proposal = rawProposal;

    if (proposal.actionType === 'adjust_budget_allocation') {
      const payload = proposal.payload;
      const index = findMatchingCategoryIndex(event.categories || [], payload.categoryName);

      if (index === -1) {
        return {
          ...proposal,
          status: 'conflict',
          conflictReason: `Budget category "${payload.categoryName}" no longer exists in this celebration.`,
        };
      }
    }

    if (proposal.actionType === 'update_preference') {
      const payload = proposal.payload;
      const conflict = detectPreferenceConflict(
        event.preferences,
        payload.category,
        payload.proposedValue
      );
      if (conflict.hasConflict) {
        return {
          ...proposal,
          status: 'conflict',
          conflictReason: conflict.reason,
        };
      }
    }

    return proposal;
  });
}

/**
 * Deterministically applies an accepted AI proposal to the event model.
 *
 * CRITICAL INVARIANTS:
 * - Budget adjustments strictly update category allocations and recalculate summaries;
 *   they NEVER fabricate expense lines or alter actual spending.
 * - Timeline additions preserve all existing tasks, manual date overrides, and completion states.
 * - Vendor suggestions create planning/interview checklist tasks, never fake supplier contact records.
 */
export function applyProposalToEvent(
  event: Event,
  rawProposal: StagedProposal
): ApplyProposalResult {
  const now = new Date().toISOString();

  if (!isDiscriminatedProposal(rawProposal)) {
    const unhandled: unknown = rawProposal;
    const actionType =
      typeof unhandled === 'object' && unhandled !== null && 'actionType' in unhandled
        ? String((unhandled as Record<string, unknown>).actionType)
        : 'unknown';
    return {
      success: false,
      event,
      error: `Unsupported proposal action type: ${actionType}`,
    };
  }

  const proposal = rawProposal;

  switch (proposal.actionType) {
    case 'adjust_budget_allocation': {
      const payload = proposal.payload;
      const categories = event.categories || [];
      const index = findMatchingCategoryIndex(categories, payload.categoryName);

      if (index === -1) {
        return {
          success: false,
          event,
          error: `Category "${payload.categoryName}" was not found in the budget ledger.`,
        };
      }

      if (typeof payload.proposedAllocated !== 'number' || payload.proposedAllocated < 0) {
        return {
          success: false,
          event,
          error: 'Proposed allocation amount must be a non-negative number.',
        };
      }

      const updatedCategories = [...categories];
      updatedCategories[index] = {
        ...updatedCategories[index],
        allocatedAmount: Math.round(payload.proposedAllocated),
      };

      return {
        success: true,
        event: {
          ...event,
          categories: updatedCategories,
          updatedAt: now,
        },
      };
    }

    case 'add_task': {
      const payload = proposal.payload;
      const offsetDays = typeof payload.offsetDays === 'number' ? payload.offsetDays : 0;
      const calculatedDate = calculateMilestoneDate(event.date, offsetDays);

      // Find matching milestone if provided
      let milestoneId: string | undefined;
      if (payload.milestoneTitle && Array.isArray(event.milestones)) {
        const foundMs = event.milestones.find(
          (m) => m.title.trim().toLowerCase() === payload.milestoneTitle?.trim().toLowerCase()
        );
        if (foundMs) {
          milestoneId = foundMs.id;
        }
      }

      // If no milestone match, pick closest milestone by offset if available
      if (!milestoneId && Array.isArray(event.milestones) && event.milestones.length > 0) {
        let closest = event.milestones[0];
        let minDiff = Math.abs(closest.offsetDays - offsetDays);
        for (const ms of event.milestones) {
          const diff = Math.abs(ms.offsetDays - offsetDays);
          if (diff < minDiff) {
            minDiff = diff;
            closest = ms;
          }
        }
        milestoneId = closest.id;
      }

      const newTask: ChecklistTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        milestoneId,
        title: payload.title,
        dueDate: calculatedDate,
        isDueDateOverridden: false,
        priority: payload.priority || 'medium',
        status: 'pending',
        description: payload.description,
        createdAt: now,
        updatedAt: now,
      };

      return {
        success: true,
        event: {
          ...event,
          tasks: [...(event.tasks || []), newTask],
          updatedAt: now,
        },
      };
    }

    case 'add_milestone': {
      const payload = proposal.payload;
      const offsetDays = typeof payload.offsetDays === 'number' ? payload.offsetDays : 0;

      const newMilestone: TimelineMilestone = {
        id: `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: payload.title,
        offsetDays,
        description: payload.description,
      };

      return {
        success: true,
        event: {
          ...event,
          milestones: [...(event.milestones || []), newMilestone],
          updatedAt: now,
        },
      };
    }

    case 'add_checklist_item': {
      const payload = proposal.payload;
      const calculatedDate = calculateMilestoneDate(event.date, -7); // Default 1 week prior

      const newChecklistTask: ChecklistTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Checklist (${payload.area}): ${payload.itemText}`,
        dueDate: calculatedDate,
        isDueDateOverridden: false,
        priority: 'medium',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      return {
        success: true,
        event: {
          ...event,
          tasks: [...(event.tasks || []), newChecklistTask],
          updatedAt: now,
        },
      };
    }

    case 'suggest_vendor_followup': {
      const payload = proposal.payload;
      const calculatedDate = calculateMilestoneDate(event.date, -30); // Default 1 month prior

      const questionsList = Array.isArray(payload.suggestedQuestions)
        ? payload.suggestedQuestions.map((q: string) => `• ${q}`).join('\n')
        : '';
      const notes = payload.checklistNotes ? `\n\nNotes: ${payload.checklistNotes}` : '';

      const newVendorTask: ChecklistTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Vendor Interview & Scope: ${payload.vendorCategory}`,
        dueDate: calculatedDate,
        isDueDateOverridden: false,
        priority: 'high',
        status: 'pending',
        description: `Suggested Discovery Questions:\n${questionsList}${notes}`,
        createdAt: now,
        updatedAt: now,
      };

      return {
        success: true,
        event: {
          ...event,
          tasks: [...(event.tasks || []), newVendorTask],
          updatedAt: now,
        },
      };
    }

    case 'update_preference': {
      const payload = proposal.payload;
      const currentPrefs = event.preferences || createEmptyPreferences();

      // Proposals when accepted become confirmed preferences, recording ai_inference source
      const mergeResult = mergeSinglePreferenceField(
        currentPrefs,
        payload.category,
        payload.field,
        payload.proposedValue,
        'confirmed',
        'ai_inference'
      );

      if (!mergeResult.success || !mergeResult.preferences) {
        return {
          success: false,
          event,
          error: mergeResult.error || 'Failed to merge preference update.',
        };
      }

      return {
        success: true,
        event: {
          ...event,
          preferences: mergeResult.preferences,
          updatedAt: now,
        },
      };
    }

    default: {
      const unhandled: unknown = proposal;
      const unhandledAction =
        typeof unhandled === 'object' && unhandled !== null && 'actionType' in unhandled
          ? String((unhandled as Record<string, unknown>).actionType)
          : 'unknown';
      return {
        success: false,
        event,
        error: `Unsupported proposal action type: ${unhandledAction}`,
      };
    }
  }
}

/**
 * Dismisses a proposal by marking its status as 'dismissed'.
 * Does not mutate the event model.
 */
export function dismissProposal(
  proposals: StagedProposal[],
  proposalId: string
): StagedProposal[] {
  return proposals.map((p) =>
    p.id === proposalId ? { ...p, status: 'dismissed' as const } : p
  );
}

/**
 * Marks a proposal as 'accepted' in the staged list upon successful application.
 */
export function markProposalAccepted(
  proposals: StagedProposal[],
  proposalId: string
): StagedProposal[] {
  return proposals.map((p) =>
    p.id === proposalId ? { ...p, status: 'accepted' as const } : p
  );
}
