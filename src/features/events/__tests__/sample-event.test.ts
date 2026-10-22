import { describe, expect, it } from 'vitest';
import { createSampleEvent, SAMPLE_EVENT_ID } from '../sample-event';
import { calculateBudgetSummary, calculateCategorySummaries } from '../budget-engine';
import { calculateVendorFinancials } from '../../vendors/vendor-engine';
import { calculateAttendanceSummary } from '../../guests/guest-engine';
import { calculateSeatingSummary, getUnassignedAttendees } from '../../seating/seating-engine';

describe('Sample Celebration Baseline (Aarav & Meera)', () => {
  const sample = createSampleEvent();

  it('has valid metadata, target date of 19 January 2027, and 350 target guests', () => {
    expect(sample.id).toBe(SAMPLE_EVENT_ID);
    expect(sample.isSample).toBe(true);
    expect(sample.title).toBe("Aarav & Meera's Vivaha Celebration");
    expect(sample.type).toBe('wedding');
    expect(sample.date).toBe('2027-01-19');
    expect(sample.location).toContain('Bengaluru');
    expect(sample.budgetCap).toBe(2500000);
    expect(sample.currency).toBe('INR');
    expect(sample.guestTarget).toBe(350);
  });

  it('has internally consistent and non-overallocated budget categories', () => {
    const summary = calculateBudgetSummary(
      sample.budgetCap,
      sample.categories,
      sample.expenses,
      sample.guestTarget,
      sample.currency
    );

    expect(summary.budgetCap).toBe(2500000);
    expect(summary.totalAllocated).toBe(2500000);
    expect(summary.isOverAllocated).toBe(false);
    expect(summary.unallocatedBudget).toBe(0);
    expect(summary.costPerGuest).toBe(Math.round(2500000 / 350));

    const categorySummaries = calculateCategorySummaries(sample.categories, sample.expenses);
    expect(categorySummaries.length).toBe(6);
  });

  it('has consistent vendor contracts with agreed and paid balance tracking', () => {
    const financials = calculateVendorFinancials(sample.vendors);

    expect(sample.vendors.length).toBe(6);
    expect(financials.totalAgreed).toBe(1775000);
    expect(financials.totalPaid).toBe(1140000);
    expect(financials.totalRemaining).toBe(635000);
  });

  it('has deterministic guest attendance counts and dietary records', () => {
    const attendance = calculateAttendanceSummary(sample.guests);

    expect(sample.guests.length).toBe(14);
    expect(attendance.confirmedCount).toBe(11);
    expect(attendance.expectedPlusOnes).toBe(3);
    expect(attendance.expectedAttendance).toBe(14); // 11 + 3
    expect(attendance.pendingCount).toBe(2);
    expect(attendance.declinedCount).toBe(1);

    // Dietary preferences
    expect(attendance.dietaryBreakdown['vegetarian']).toBeGreaterThan(0);
  });

  it('has deterministic banquet seating with positive table capacities and 2 unassigned attendees', () => {
    const seating = calculateSeatingSummary(sample.tables, sample.assignments, sample.guests);

    expect(sample.tables.length).toBe(4);
    expect(seating.totalSeats).toBe(30);
    expect(sample.assignments.length).toBe(12);
    expect(seating.expectedAssigned).toBe(12);
    expect(seating.unassignedExpected).toBe(2);
    expect(seating.overCapacityCount).toBe(0);
    expect(seating.seatingProgressPct).toBe(Math.round((12 / 14) * 100)); // 86%

    // Unassigned attendees queue contains confirmed and pending attendees not yet assigned
    const unassigned = getUnassignedAttendees(sample.guests, sample.households, sample.assignments);
    expect(unassigned.length).toBe(4); // 2 confirmed + 2 pending
    const confirmedUnassigned = unassigned.filter((u) => u.rsvpStatus === 'confirmed');
    expect(confirmedUnassigned.length).toBe(2);
    const unassignedNames = confirmedUnassigned.map((u) => u.displayName);
    expect(unassignedNames).toContain('Meenakshi Iyer');
    expect(unassignedNames).toContain('Sameer Khan');
  });

  it('preserves milestone sequence aligned with date offsets', () => {
    expect(sample.milestones.length).toBe(6);
    expect(sample.tasks.length).toBe(9);

    // Every task must reference a valid milestone
    const milestoneIds = new Set(sample.milestones.map((m: { id: string }) => m.id));
    for (const t of sample.tasks) {
      if (t.milestoneId) {
        expect(milestoneIds.has(t.milestoneId)).toBe(true);
      }
    }
  });
});
