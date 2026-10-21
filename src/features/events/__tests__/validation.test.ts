import { describe, it, expect } from 'vitest';
import {
  calculateDaysRemaining,
  formatCurrency,
  formatDateDisplay,
  isValidCalendarDate,
  validateEvent,
  validateEventInput,
} from '../validation';

describe('Validation Engine - Calendar & Math Rules', () => {
  describe('isValidCalendarDate', () => {
    it('accepts valid calendar dates', () => {
      expect(isValidCalendarDate('2026-11-20')).toBe(true);
      expect(isValidCalendarDate('2024-02-29')).toBe(true); // leap year
      expect(isValidCalendarDate('2026-01-01')).toBe(true);
    });

    it('rejects invalid or non-existent calendar dates', () => {
      expect(isValidCalendarDate('2026-02-29')).toBe(false); // not leap year
      expect(isValidCalendarDate('2026-02-30')).toBe(false);
      expect(isValidCalendarDate('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidCalendarDate('2026-13-01')).toBe(false);
      expect(isValidCalendarDate('invalid-date')).toBe(false);
      expect(isValidCalendarDate('')).toBe(false);
    });
  });

  describe('calculateDaysRemaining', () => {
    it('calculates deterministic day differences without timezone drift', () => {
      const ref = new Date(2026, 9, 21); // October 21, 2026
      expect(calculateDaysRemaining('2026-10-21', ref)).toBe(0);
      expect(calculateDaysRemaining('2026-10-22', ref)).toBe(1);
      expect(calculateDaysRemaining('2026-10-31', ref)).toBe(10);
      expect(calculateDaysRemaining('2026-10-15', ref)).toBe(-6);
    });

    it('returns 0 for invalid target dates', () => {
      expect(calculateDaysRemaining('not-a-date')).toBe(0);
    });
  });

  describe('formatDateDisplay', () => {
    it('formats YYYY-MM-DD into human-readable editorial date', () => {
      expect(formatDateDisplay('2026-11-20')).toBe('20 November 2026');
      expect(formatDateDisplay('2026-01-05')).toBe('5 January 2026');
    });

    it('returns raw string if invalid', () => {
      expect(formatDateDisplay('bad-date')).toBe('bad-date');
    });
  });

  describe('formatCurrency', () => {
    it('formats INR using the Indian numbering format (Lakhs & Crores)', () => {
      expect(formatCurrency(2500000, 'INR')).toBe('₹25,00,000');
      expect(formatCurrency(50000, 'INR')).toBe('₹50,000');
      expect(formatCurrency(1500, 'INR')).toBe('₹1,500');
      expect(formatCurrency(500, 'INR')).toBe('₹500');
      expect(formatCurrency(10000000, 'INR')).toBe('₹1,00,00,000'); // 1 Crore
    });

    it('formats USD, EUR, and GBP appropriately', () => {
      expect(formatCurrency(25000, 'USD')).toBe('$25,000');
      expect(formatCurrency(12500, 'EUR')).toBe('€12,500');
      expect(formatCurrency(8000, 'GBP')).toBe('£8,000');
    });

    it('handles negative and 0 amounts gracefully', () => {
      expect(formatCurrency(0, 'INR')).toBe('₹0');
      expect(formatCurrency(-50000, 'INR')).toBe('-₹50,000');
    });
  });
});

describe('Validation Engine - Event Input & Integrity', () => {
  it('validates a correct EventInput successfully', () => {
    const raw = {
      type: 'wedding',
      title: "Priya & Rohan's Celebration",
      date: '2026-12-15',
      location: 'Taj West End, Bengaluru',
      guestTarget: 250,
      budgetCap: 1500000,
      currency: 'INR',
      culturalContext: {
        traditionOrTheme: 'Traditional vivaha ceremony',
      },
    };

    const res = validateEventInput(raw);
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.data.title).toBe("Priya & Rohan's Celebration");
      expect(res.data.guestTarget).toBe(250);
      expect(res.data.budgetCap).toBe(1500000);
      expect(res.data.currency).toBe('INR');
    }
  });

  it('rejects invalid inputs with plain-language field error messages', () => {
    const raw = {
      type: 'invalid_type',
      title: 'Hi', // too short (< 3 chars)
      date: '2026-02-30', // invalid date
      guestTarget: -10, // negative guests
      budgetCap: 0, // non-positive budget
      currency: 'XYZ',
    };

    const res = validateEventInput(raw);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.errors.type).toBeDefined();
      expect(res.errors.title).toContain('at least 3 characters');
      expect(res.errors.date).toContain('valid calendar date');
      expect(res.errors.guestTarget).toContain('positive whole number');
      expect(res.errors.budgetCap).toContain('positive amount');
      expect(res.errors.currency).toBeDefined();
    }
  });

  it('rejects non-object raw data', () => {
    expect(validateEventInput(null).isValid).toBe(false);
    expect(validateEventInput('string').isValid).toBe(false);
  });

  it('validates a complete persisted Event object', () => {
    const valid = {
      id: 'evt-1234',
      type: 'birthday',
      title: "Maya's 30th Birthday",
      date: '2026-11-10',
      guestTarget: 50,
      budgetCap: 100000,
      currency: 'INR',
      isSample: false,
      createdAt: '2026-10-21T10:00:00.000Z',
      updatedAt: '2026-10-21T10:00:00.000Z',
    };

    const res = validateEvent(valid);
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.data.id).toBe('evt-1234');
      expect(res.data.isSample).toBe(false);
    }
  });

  it('rejects persisted event without an id', () => {
    const missingId = {
      type: 'birthday',
      title: "Maya's 30th Birthday",
      date: '2026-11-10',
      guestTarget: 50,
      budgetCap: 100000,
      currency: 'INR',
    };

    const res = validateEvent(missingId);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.errors.id).toBeDefined();
    }
  });
});
