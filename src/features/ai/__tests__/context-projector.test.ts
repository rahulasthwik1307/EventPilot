import { describe, expect, it } from 'vitest';
import { extractCityFromLocation, projectEventContextForAI } from '../context-projector';
import { createFreshSampleEvent } from '../../events/sample-event';

describe('context-projector (Privacy & Context Minimization)', () => {
  const sampleEvent = createFreshSampleEvent();

  it('extracts city or region cleanly from comma-separated location strings', () => {
    expect(extractCityFromLocation('The Tamarind Tree, Kanakapura Road, Bengaluru')).toBe('Bengaluru');
    expect(extractCityFromLocation('Vivanta Taj, MG Road, Mumbai')).toBe('Mumbai');
    expect(extractCityFromLocation('Hyderabad')).toBe('Hyderabad');
    expect(extractCityFromLocation('')).toBeUndefined();
    expect(extractCityFromLocation(undefined)).toBeUndefined();
  });

  it('projects basic event context without leaking PII for ideas intent', () => {
    const projected = projectEventContextForAI(sampleEvent, 'ideas');

    expect(projected.eventType).toBe('wedding');
    expect(projected.title).toBe("Aarav & Meera's Vivaha Celebration");
    expect(projected.date).toBe(sampleEvent.date);
    expect(projected.city).toBe('Bengaluru');
    expect(projected.currency).toBe('INR');
    expect(projected.budgetCap).toBe(2500000);

    // Categories and attendance should be omitted for ideas intent to minimize tokens
    expect(projected.categorySummary).toBeUndefined();
    expect(projected.expectedAttendance).toBeUndefined();
  });

  it('includes category allocations for budget intent while omitting expenses', () => {
    const projected = projectEventContextForAI(sampleEvent, 'budget');

    expect(projected.categorySummary).toBeDefined();
    expect(projected.categorySummary?.length).toBeGreaterThan(0);
    expect(projected.categorySummary?.[0]).toHaveProperty('name');
    expect(projected.categorySummary?.[0]).toHaveProperty('allocatedAmount');

    // Never includes itemized expenses or actual payments
    expect((projected as any).expenses).toBeUndefined();
  });

  it('includes aggregate attendance for guests intent while omitting individual records', () => {
    const projected = projectEventContextForAI(sampleEvent, 'guests');

    expect(projected.expectedAttendance).toBe(14); // Confirmed named (11) + Confirmed plus-ones (3)
    expect((projected as any).guests).toBeUndefined();
    expect((projected as any).households).toBeUndefined();
    expect((projected as any).tables).toBeUndefined();
  });

  it('CRITICAL PRIVACY TEST: strictly excludes all guest PII, contacts, dietary data, and vendor details', () => {
    const projected = projectEventContextForAI(sampleEvent, 'general');
    const serialized = JSON.stringify(projected);

    // Guest names from sample event
    expect(serialized).not.toContain('Priya');
    expect(serialized).not.toContain('Sharma');
    expect(serialized).not.toContain('Vikram Malhotra');
    expect(serialized).not.toContain('Arjun');
    expect(serialized).not.toContain('Verma');
    expect(serialized).not.toContain('Dr. K.S.');

    // Guest contact numbers and emails
    expect(serialized).not.toContain('98451 11001');
    expect(serialized).not.toContain('priya.sharma@example.com');
    expect(serialized).not.toContain('@example.com');

    // Private dietary preferences and medical notes
    expect(serialized).not.toContain('jain');
    expect(serialized).not.toContain('celiac');
    expect(serialized).not.toContain('diabetic sadya');
    expect(serialized).not.toContain('gluten_free');

    // Household and vendor contacts
    expect(serialized).not.toContain('The Sharma Family');
    expect(serialized).not.toContain('Indiranagar Society Circle');
    expect(serialized).not.toContain('Annapurna Heritage Caterers');
    expect(serialized).not.toContain('contact@tamarindtree.in');
  });

  it('preserves cultural celebration notes when provided by the user', () => {
    const projected = projectEventContextForAI(sampleEvent, 'ideas');

    expect(projected.culturalContext).toBeDefined();
    expect(projected.culturalContext?.traditionOrTheme).toContain('South Indian Vivaha');
  });
});
