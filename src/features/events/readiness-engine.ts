/**
 * Event Pilot Celebration Readiness Engine
 * Pure deterministic composite readiness calculation (10-100%).
 * Guardrail: Never delegate arithmetic to language models.
 */

import { EventType } from './types';

export interface ReadinessInput {
  type: EventType;
  budgetCap: number;
  totalAllocated: number;
  guestTarget: number;
  expectedAttendance: number;
  taskMetrics: {
    total: number;
    completed: number;
    overdue: number;
    pct: number;
  };
}

export interface ReadinessWeights {
  budgetWeight: number;
  taskWeight: number;
  rsvpWeight: number;
  rationale: string;
}

/**
 * Domain-specific readiness weighting models per celebration archetype.
 *
 * Rationale:
 * - Community Festival: Driven heavily by civic permits, municipal NOCs, volunteer tasks,
 *   and stage setup milestones (50%). Budget allocation covers community feasts and infrastructure (30%).
 *   Guest RSVP tracking is less critical for open public celebrations (20%).
 * - Wedding (Vivaha): Balanced triad requiring ceremonial ritual readiness (35%),
 *   substantial financial/vendor commitments (35%), and headcount tracking for traditional feast dining (30%).
 * - Milestone Birthday: Balanced execution across themed entertainment/cake tasks (35%),
 *   venue & hospitality budget (35%), and family/friend attendance confirmations (30%).
 */
export const ARCHETYPE_READINESS_WEIGHTS: Record<EventType, ReadinessWeights> = {
  community: {
    taskWeight: 0.50,
    budgetWeight: 0.30,
    rsvpWeight: 0.20,
    rationale: 'Prioritizes civic permits, volunteer task checklists, and public safety milestones.',
  },
  wedding: {
    taskWeight: 0.35,
    budgetWeight: 0.35,
    rsvpWeight: 0.30,
    rationale: 'Balanced triad across ritual milestones, financial commitments, and feast seating.',
  },
  birthday: {
    taskWeight: 0.35,
    budgetWeight: 0.35,
    rsvpWeight: 0.30,
    rationale: 'Proportional weighting across party tasks, venue budget, and friend/family attendance.',
  },
};

export interface ReadinessResult {
  score: number; // Clamped 10 - 100%
  budgetScore: number; // 0 - 100%
  taskScore: number; // 0 - 100%
  rsvpScore: number; // 0 - 100%
  overduePenalty: number;
  weights: ReadinessWeights;
}

/**
 * Deterministically computes the composite readiness execution score.
 * Pure function: Zero side-effects, handles empty events safely, bounded [10, 100].
 */
export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  const weights =
    ARCHETYPE_READINESS_WEIGHTS[input.type] || ARCHETYPE_READINESS_WEIGHTS.wedding;

  // 1. Budget Score (0-100% of budget cap allocated)
  const safeCap = Number.isFinite(input.budgetCap) && input.budgetCap > 0 ? input.budgetCap : 0;
  const safeAllocated =
    Number.isFinite(input.totalAllocated) && input.totalAllocated > 0 ? input.totalAllocated : 0;
  const budgetScore =
    safeCap > 0 ? Math.min(100, Math.round((safeAllocated / safeCap) * 100)) : 0;

  // 2. Task Score (0-100% of checklist tasks completed)
  const taskScore =
    Number.isFinite(input.taskMetrics.pct) && input.taskMetrics.pct >= 0
      ? Math.min(100, Math.round(input.taskMetrics.pct))
      : 0;

  // 3. RSVP / Attendance Score (0-100% of target headcount confirmed)
  const safeTarget =
    Number.isFinite(input.guestTarget) && input.guestTarget > 0 ? input.guestTarget : 0;
  const safeAttendance =
    Number.isFinite(input.expectedAttendance) && input.expectedAttendance > 0
      ? input.expectedAttendance
      : 0;
  const rsvpScore =
    safeTarget > 0 ? Math.min(100, Math.round((safeAttendance / safeTarget) * 100)) : 0;

  // 4. Overdue Penalty: 2 points per overdue task (capped at 10 points max deduction)
  const overdueCount =
    Number.isFinite(input.taskMetrics.overdue) && input.taskMetrics.overdue > 0
      ? input.taskMetrics.overdue
      : 0;
  const overduePenalty = Math.min(10, overdueCount * 2);

  // 5. Composite weighted calculation
  const rawComposite =
    budgetScore * weights.budgetWeight +
    taskScore * weights.taskWeight +
    rsvpScore * weights.rsvpWeight;

  const penalizedComposite = Math.round(rawComposite - overduePenalty);

  // Score is bounded between 10% (baseline starting runway) and 100%
  const score = Math.max(10, Math.min(100, penalizedComposite));

  return {
    score,
    budgetScore,
    taskScore,
    rsvpScore,
    overduePenalty,
    weights,
  };
}
