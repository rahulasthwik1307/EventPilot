import { describe, expect, it } from 'vitest';
import {
  calculateReadinessScore,
  ARCHETYPE_READINESS_WEIGHTS,
  ReadinessInput,
} from '../readiness-engine';

describe('Readiness Engine - Archetype-Aware Scoring', () => {
  it('defines documented weights for all three celebration archetypes', () => {
    expect(ARCHETYPE_READINESS_WEIGHTS.community.taskWeight).toBe(0.5);
    expect(ARCHETYPE_READINESS_WEIGHTS.community.budgetWeight).toBe(0.3);
    expect(ARCHETYPE_READINESS_WEIGHTS.community.rsvpWeight).toBe(0.2);

    expect(ARCHETYPE_READINESS_WEIGHTS.wedding.taskWeight).toBe(0.35);
    expect(ARCHETYPE_READINESS_WEIGHTS.wedding.budgetWeight).toBe(0.35);
    expect(ARCHETYPE_READINESS_WEIGHTS.wedding.rsvpWeight).toBe(0.3);

    expect(ARCHETYPE_READINESS_WEIGHTS.birthday.taskWeight).toBe(0.35);
    expect(ARCHETYPE_READINESS_WEIGHTS.birthday.budgetWeight).toBe(0.35);
    expect(ARCHETYPE_READINESS_WEIGHTS.birthday.rsvpWeight).toBe(0.3);
  });

  it('handles empty events gracefully with minimum baseline score of 10%', () => {
    const input: ReadinessInput = {
      type: 'community',
      budgetCap: 0,
      totalAllocated: 0,
      guestTarget: 0,
      expectedAttendance: 0,
      taskMetrics: { total: 0, completed: 0, overdue: 0, pct: 0 },
    };

    const result = calculateReadinessScore(input);
    expect(result.score).toBe(10);
    expect(result.budgetScore).toBe(0);
    expect(result.taskScore).toBe(0);
    expect(result.rsvpScore).toBe(0);
    expect(result.overduePenalty).toBe(0);
  });

  it('calculates 100% score for fully prepared events with 0 overdue tasks', () => {
    const input: ReadinessInput = {
      type: 'wedding',
      budgetCap: 1500000,
      totalAllocated: 1500000,
      guestTarget: 250,
      expectedAttendance: 250,
      taskMetrics: { total: 20, completed: 20, overdue: 0, pct: 100 },
    };

    const result = calculateReadinessScore(input);
    expect(result.score).toBe(100);
    expect(result.budgetScore).toBe(100);
    expect(result.taskScore).toBe(100);
    expect(result.rsvpScore).toBe(100);
  });

  it('gives appropriate weight to community tasks and permits over RSVP counts', () => {
    // A community festival with 100% tasks completed, 100% budget allocated, but only 20% RSVPs (open festival)
    const communityInput: ReadinessInput = {
      type: 'community',
      budgetCap: 500000,
      totalAllocated: 500000,
      guestTarget: 500,
      expectedAttendance: 100, // 20%
      taskMetrics: { total: 10, completed: 10, overdue: 0, pct: 100 },
    };

    // A wedding with the identical 20% RSVPs, 100% tasks, 100% budget
    const weddingInput: ReadinessInput = {
      type: 'wedding',
      budgetCap: 1500000,
      totalAllocated: 1500000,
      guestTarget: 250,
      expectedAttendance: 50, // 20%
      taskMetrics: { total: 10, completed: 10, overdue: 0, pct: 100 },
    };

    const communityRes = calculateReadinessScore(communityInput);
    const weddingRes = calculateReadinessScore(weddingInput);

    // Community festival: 100*0.5 (task) + 100*0.3 (budget) + 20*0.2 (rsvp) = 50 + 30 + 4 = 84%
    expect(communityRes.score).toBe(84);

    // Wedding: 100*0.35 (task) + 100*0.35 (budget) + 20*0.3 (rsvp) = 35 + 35 + 6 = 76%
    expect(weddingRes.score).toBe(76);

    // Confirms community festival is not unfairly penalized by open public attendance
    expect(communityRes.score).toBeGreaterThan(weddingRes.score);
  });

  it('applies an overdue task penalty capped at 10 points', () => {
    const input: ReadinessInput = {
      type: 'wedding',
      budgetCap: 1000000,
      totalAllocated: 1000000, // 100%
      guestTarget: 100,
      expectedAttendance: 100, // 100%
      taskMetrics: { total: 10, completed: 8, overdue: 3, pct: 80 },
    };

    // Raw score: 100*0.35 + 80*0.35 + 100*0.30 = 35 + 28 + 30 = 93
    // Overdue penalty: 3 * 2 = 6 points
    // Expected: 93 - 6 = 87
    const result = calculateReadinessScore(input);
    expect(result.overduePenalty).toBe(6);
    expect(result.score).toBe(87);

    // Test penalty cap at 10 points
    const highOverdueInput: ReadinessInput = {
      ...input,
      taskMetrics: { total: 10, completed: 5, overdue: 8, pct: 50 },
    };
    const highOverdueRes = calculateReadinessScore(highOverdueInput);
    expect(highOverdueRes.overduePenalty).toBe(10); // capped at 10
  });

  it('handles negative or NaN numeric inputs safely without throwing', () => {
    const input: ReadinessInput = {
      type: 'birthday',
      budgetCap: -500,
      totalAllocated: NaN,
      guestTarget: -10,
      expectedAttendance: NaN,
      taskMetrics: { total: -5, completed: -2, overdue: -1, pct: -50 },
    };

    const result = calculateReadinessScore(input);
    expect(result.score).toBe(10);
    expect(result.budgetScore).toBe(0);
    expect(result.taskScore).toBe(0);
    expect(result.rsvpScore).toBe(0);
  });
});
