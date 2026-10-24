import { Event } from '@/features/events/types';
import { VendorCategory, VendorRequirementBrief } from '../types';

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: 'Venue & Facilities',
  catering: 'Catering & Food Service',
  photography: 'Photography & Cinematography',
  decoration: 'Decor, Styling & Florals',
  entertainment: 'Entertainment & Artists',
  music_dj: 'Music, Sound & DJ',
  clothing_makeup: 'Attire & Makeup',
  transport: 'Logistics & Transport',
  accommodation: 'Guest Accommodation',
  invitations_printing: 'Stationery & Invitations',
  equipment_rentals: 'Equipment & Rentals',
  other: 'General Vendor Services',
};

/**
 * Generates a structured, privacy-safe vendor requirement brief.
 * Explicitly excludes private guest lists, dietary registries, contact numbers, and internal planner notes.
 */
export function generateVendorRequirementBrief(
  event: Event,
  category: VendorCategory
): VendorRequirementBrief {
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const currency = event.currency || 'INR';

  // Calculate category budget envelope from categories and expenses
  const categoryLower = category.toLowerCase();
  const matchingCategories = (event.categories || []).filter((c) =>
    c.id.toLowerCase().includes(categoryLower) ||
    c.name.toLowerCase().includes(categoryLower) ||
    categoryLower.includes(c.name.toLowerCase())
  );
  const matchingCategoryIds = new Set(matchingCategories.map((c) => c.id));

  const categoryExpenses = (event.expenses || []).filter(
    (e) => matchingCategoryIds.has(e.categoryId) || e.title.toLowerCase().includes(categoryLower)
  );

  let allocatedCategoryBudget = matchingCategories.reduce(
    (sum, c) => sum + (c.allocatedAmount || 0),
    0
  );

  if (allocatedCategoryBudget === 0 && categoryExpenses.length > 0) {
    allocatedCategoryBudget = categoryExpenses.reduce(
      (sum, e) => sum + (e.estimatedAmount || 0),
      0
    );
  }

  const budgetCapFormatted = event.budgetCap
    ? `${currency} ${event.budgetCap.toLocaleString('en-IN')}`
    : undefined;

  const allocatedCategoryBudgetFormatted = allocatedCategoryBudget > 0
    ? `${currency} ${allocatedCategoryBudget.toLocaleString('en-IN')}`
    : undefined;

  // Extract confirmed preferences relevant to this category
  const confirmedPreferences: Array<{ label: string; value: string }> = [];
  const confirmedNonNegotiables: string[] = [];
  const openQuestions: string[] = [];

  const prefs = event.preferences;

  if (prefs) {
    const dietaryStyle =
      prefs.tradition?.value?.dietaryStyle || (prefs as any).dietaryStyle;
    const notes =
      prefs.tradition?.value?.notes ||
      prefs.priorities?.value?.experienceNotes ||
      (prefs as any).notes;
    const atmosphere =
      prefs.priorities?.value?.atmosphere || (prefs as any).atmosphere;
    const nonNegotiables =
      prefs.budget?.value?.nonNegotiables || (prefs as any).nonNegotiables;
    const primaryFocus = prefs.priorities?.value?.primaryFocus || [];
    const spendingPriorities = prefs.budget?.value?.spendingPriorities || [];
    const venuePreference = prefs.logistics?.value?.venueTypePreference;

    if (category === 'catering') {
      if (dietaryStyle) {
        confirmedPreferences.push({
          label: 'Primary Dietary Style',
          value: String(dietaryStyle).replace(/_/g, ' '),
        });
      } else {
        openQuestions.push('Primary dietary format (e.g. Vegetarian, Multi-Cuisine, Jain options) to be finalized');
      }

      if (notes) {
        const sanitizedNote = String(notes)
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email redacted]')
          .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[phone redacted]');
        confirmedPreferences.push({
          label: 'Organizer Culinary Notes',
          value: sanitizedNote,
        });
      }
    }

    if (category === 'venue') {
      if (venuePreference) {
        confirmedPreferences.push({
          label: 'Venue Format',
          value: `${String(venuePreference).replace(/_/g, ' ')} (${event.guestTarget} attendees expected)`,
        });
      } else if (atmosphere) {
        confirmedPreferences.push({
          label: 'Atmosphere Style',
          value: `${String(atmosphere).replace(/_/g, ' ')} celebration (${event.guestTarget} attendees expected)`,
        });
      }
    }

    // Priorities
    const focusNames: string[] = [
      ...primaryFocus.map((f: string) => f.replace(/_/g, ' ')),
      ...spendingPriorities,
      ...(Array.isArray((prefs as any).priorities) ? (prefs as any).priorities : []),
    ];

    const isPriorityCategory = focusNames.some((p: string) =>
      p.toLowerCase().includes(category.toLowerCase())
    );

    if (isPriorityCategory) {
      confirmedPreferences.push({
        label: 'Priority Tier',
        value: 'High-priority aesthetic and experiential focus for the host',
      });
    }

    // Non-negotiables
    if (Array.isArray(nonNegotiables) && nonNegotiables.length > 0) {
      nonNegotiables.forEach((item: string) => {
        confirmedNonNegotiables.push(item);
      });
    }
  }

  // If no category-specific preferences exist, add default guidance
  if (confirmedPreferences.length === 0) {
    confirmedPreferences.push({
      label: 'Guest Headcount',
      value: `Targeting approximately ${event.guestTarget} guests`,
    });
  }

  // Timing constraints from timeline tasks
  const timingConstraints: Array<{ milestone: string; dueDate: string }> = [];
  (event.tasks || [])
    .filter((t) => t.category === category || t.title.toLowerCase().includes(category.toLowerCase()))
    .forEach((t) => {
      timingConstraints.push({
        milestone: t.title,
        dueDate: t.dueDate,
      });
    });

  // Standard open questions if none added
  if (openQuestions.length === 0) {
    openQuestions.push('Itemized breakdown of taxes (GST / local fees) and payment milestones');
    openQuestions.push('Overtime rates and setup / breakdown logistical allowances');
    openQuestions.push('Cancellation and force majeure postponement policy');
  }

  // Construct clean formatted text document representation without raw Markdown symbols
  const lines: string[] = [];
  lines.push('================================================================================');
  lines.push('OFFICIAL PROCUREMENT BRIEF');
  lines.push(`Vendor Requirement Brief: ${categoryLabel}`);
  lines.push('================================================================================');
  lines.push('');
  lines.push('Celebration Overview');
  lines.push(`• Event: ${event.title} (${event.type || 'Celebration'})`);
  lines.push(`• Date of Event: ${event.date}`);
  if (event.location) {
    lines.push(`• Location: ${event.location}`);
  }
  lines.push(`• Expected Attendance: ${event.guestTarget} guests`);
  if (allocatedCategoryBudgetFormatted) {
    lines.push(`• Allocated Category Budget Envelope: ${allocatedCategoryBudgetFormatted}`);
  }
  lines.push('');

  lines.push('Confirmed Requirements & Preferences');
  confirmedPreferences.forEach((p) => {
    lines.push(`• ${p.label}: ${p.value}`);
  });
  lines.push('');

  if (confirmedNonNegotiables.length > 0) {
    lines.push('Essential Non-Negotiables');
    confirmedNonNegotiables.forEach((item) => {
      lines.push(`• ${item}`);
    });
    lines.push('');
  }

  if (timingConstraints.length > 0) {
    lines.push('Key Milestones & Timing');
    timingConstraints.forEach((t) => {
      lines.push(`• ${t.milestone}: Due by ${t.dueDate}`);
    });
    lines.push('');
  }

  lines.push('Information Requested in Your Proposal');
  lines.push('1. Scope of work and complete list of deliverables.');
  lines.push('2. Fully itemized pricing, specifying base charges and any applicable taxes/fees.');
  lines.push('3. Advance deposit requirements and payment milestone schedule.');
  lines.push('4. Quotation validity period.');
  lines.push('5. Standard cancellation and postponement provisions.');
  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('Note: Identifiable attendee names, personal contact numbers, and private family');
  lines.push('arrangements are reserved for contracted booking stages.');
  lines.push('================================================================================');

  const formattedBriefText = lines.join('\n');

  return {
    category,
    categoryLabel,
    eventTitle: event.title,
    eventType: event.type,
    eventDate: event.date,
    location: event.location,
    guestTarget: event.guestTarget,
    budgetCapFormatted,
    allocatedCategoryBudgetFormatted,
    confirmedPreferences,
    confirmedNonNegotiables,
    timingConstraints,
    openQuestions,
    formattedBriefText,
  };
}
