import { Event } from '../events/types';
import { calculateAttendanceSummary } from '../guests/guest-engine';
import { AssistantIntent, ProjectedEventContext } from './types';

/**
 * Extracts a high-level city or locality from a full location string without private address details.
 * e.g. "The Tamarind Tree, Kanakapura Road, Bengaluru" -> "Bengaluru"
 */
export function extractCityFromLocation(location?: string): string | undefined {
  if (!location) return undefined;
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  // Return the last segment if multiple, which is typically the city/region in Indian addresses
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

/**
 * Projects a strict, privacy-safe allowlisted subset of event context for the AI provider.
 *
 * PRIVACY GUARANTEES:
 * - NO guest names, phone numbers, or emails are ever included.
 * - NO household groups, relationships, or personal notes are ever included.
 * - NO dietary preferences or medical food allergies are ever included.
 * - NO vendor contact records, private agreements, or phone numbers are ever included.
 * - NO itemized actual expense records or payment transactions are ever included.
 * - The complete raw event object is NEVER serialized or transmitted.
 */
export function projectEventContextForAI(
  event: Event,
  intent: AssistantIntent
): ProjectedEventContext {
  const projected: ProjectedEventContext = {
    eventType: event.type,
    title: event.title,
    date: event.date,
    city: extractCityFromLocation(event.location),
    currency: event.currency,
    budgetCap: event.budgetCap,
  };

  // 1. Budget context: category totals only (no itemized expense lines or actual bank spend)
  if (intent === 'budget' || intent === 'general') {
    if (Array.isArray(event.categories)) {
      projected.categorySummary = event.categories.map((c) => ({
        name: c.name,
        allocatedAmount: c.allocatedAmount,
      }));
    }
  }

  // 2. Attendance context: aggregate count only (no names, phones, or dietary data)
  if (intent === 'guests' || intent === 'general') {
    const attendance = calculateAttendanceSummary(event.guests || []);
    projected.expectedAttendance = attendance.expectedAttendance;
  }

  // 3. Cultural context: user-provided celebration theme or notes
  if (event.culturalContext) {
    projected.culturalContext = {
      traditionOrTheme: event.culturalContext.traditionOrTheme,
      notes: event.culturalContext.notes,
    };
  }

  return projected;
}

export const projectPrivacySafeContext = (
  event: Event,
  intent: AssistantIntent = 'general'
): ProjectedEventContext => projectEventContextForAI(event, intent);
