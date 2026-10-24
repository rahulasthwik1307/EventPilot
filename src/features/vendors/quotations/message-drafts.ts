import { Event } from '@/features/events/types';
import {
  VendorQuotation,
  VendorMessageScenario,
  VendorMessageDraft,
} from '../types';

interface ScenarioMeta {
  title: string;
  defaultSubject: (event: Event, quote?: VendorQuotation) => string;
  buildBody: (event: Event, quote?: VendorQuotation, notes?: string) => string;
}

const SCENARIOS: Record<VendorMessageScenario, ScenarioMeta> = {
  initial_inquiry: {
    title: 'Initial Requirement Inquiry',
    defaultSubject: (event) => `Inquiry: Services for ${event.title} on ${event.date}`,
    buildBody: (event, quote, notes) => {
      const locationPart = event.location ? ` in ${event.location}` : '';
      return [
        `Dear [Vendor Name / Team],`,
        ``,
        `I hope this message finds you well.`,
        ``,
        `We are planning our upcoming ${(event.type || 'event').toLowerCase()} celebration, "${event.title}", taking place on ${event.date}${locationPart} for approximately ${event.guestTarget} guests.`,
        ``,
        `We admire your work and would appreciate receiving a detailed quotation and your package options for this date. Specifically, we would like to understand:`,
        `- Complete list of deliverables and service coverage hours`,
        `- Itemized costs, including whether taxes/fees are bundled or separate`,
        `- Advance booking deposit requirements and payment schedules`,
        `- Any constraints or setup requirements you foresee`,
        ``,
        notes ? `Additional Context:\n${notes}\n` : '',
        `Could you please share your standard package deck or an initial proposal by [Target Date for Response]?`,
        ``,
        `Warm regards,`,
        `[Your Name]`,
        `[Your Phone / Contact Details]`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },

  scope_clarification: {
    title: 'Scope & Inclusions Clarification',
    defaultSubject: (event, quote) =>
      `Scope Clarification: ${quote?.title ? `"${quote.title}"` : 'Quotation'} for ${event.title}`,
    buildBody: (event, quote, notes) => {
      const quoteTitle = quote?.title ? `"${quote.title}"` : 'your proposal';
      const quoteRef = quote?.quotedTotal
        ? ` quoted at ${quote.currency} ${quote.quotedTotal.toLocaleString('en-IN')}`
        : '';
      return [
        `Dear ${quote?.vendorName || '[Vendor Name]'},`,
        ``,
        `Thank you for sharing ${quoteTitle}${quoteRef} for our upcoming celebration on ${event.date}.`,
        ``,
        `We are reviewing your proposal and would appreciate a quick clarification on a few specific scope items before we proceed:`,
        ``,
        `- [Specific Item 1, e.g. Are setup and breakdown hours included in the coverage window?]`,
        `- [Specific Item 2, e.g. Does the package cover travel and on-site crew meals?]`,
        `- [Specific Item 3, e.g. Please clarify overtime rates if the schedule extends past contracted hours.]`,
        ``,
        notes ? `Organizer Notes:\n${notes}\n` : '',
        `Once confirmed, this will help us finalize our comparison and move toward booking.`,
        ``,
        `Thank you for your assistance.`,
        ``,
        `Warm regards,`,
        `[Your Name]`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },

  revised_quote: {
    title: 'Revised Quote / Budget Alignment',
    defaultSubject: (event, quote) =>
      `Revised Proposal Request: ${quote?.title || 'Package'} for ${event.title}`,
    buildBody: (event, quote, notes) => {
      const vendorName = quote?.vendorName || '[Vendor Name]';
      const currentPrice = quote?.quotedTotal
        ? `${quote.currency} ${quote.quotedTotal.toLocaleString('en-IN')}`
        : '[Current Quoted Amount]';

      return [
        `Dear ${vendorName},`,
        ``,
        `Thank you for your proposal (${currentPrice}) for our event on ${event.date}. We would love to collaborate with you.`,
        ``,
        `Our allocated budget ceiling for this component is [Target Budget, e.g. INR XX,XXX]. To bridge the variance, we would be grateful if you could explore a revised configuration with us:`,
        ``,
        `- Option A: Adjusting optional add-ons or scope elements (e.g. [Add-on to omit])`,
        `- Option B: Adjusting coverage duration or team size (e.g. [Duration adjustment])`,
        ``,
        notes ? `Specific Adjustments Requested:\n${notes}\n` : '',
        `Please let us know if an adjusted package is viable so we can lock in the date promptly.`,
        ``,
        `Warm regards,`,
        `[Your Name]`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },

  payment_terms: {
    title: 'Payment Terms & Milestone Schedule',
    defaultSubject: (event, quote) =>
      `Payment Schedule Discussion: ${quote?.title || 'Quotation'} — ${event.title}`,
    buildBody: (event, quote, notes) => {
      const vendorName = quote?.vendorName || '[Vendor Name]';
      return [
        `Dear ${vendorName},`,
        ``,
        `Thank you for your quotation for ${event.title} on ${event.date}.`,
        ``,
        `We are preparing our cashflow milestones and would like to propose a structured milestone schedule for the agreed total:`,
        ``,
        `- Advance Booking Retainer: [Proposed % / Amount, e.g. 25%] upon signing`,
        `- Mid-Term Milestone: [Proposed % / Amount, e.g. 50%] 2 weeks prior to event date`,
        `- Final Balance: [Remaining %, e.g. 25%] upon completion of services / handover`,
        ``,
        notes ? `Notes on Billing / GST:\n${notes}\n` : '',
        `Please confirm if this schedule works with your booking terms so we can initiate the initial retainer.`,
        ``,
        `Warm regards,`,
        `[Your Name]`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },

  scope_confirmation: {
    title: 'Pre-Contract Scope Confirmation',
    defaultSubject: (event, quote) =>
      `Confirmation & Contract Request: ${quote?.vendorName || 'Services'} — ${event.title}`,
    buildBody: (event, quote, notes) => {
      const vendorName = quote?.vendorName || '[Vendor Name]';
      const quoteTitle = quote?.title ? `"${quote.title}"` : 'the agreed package';
      const quoteTotal = quote?.quotedTotal
        ? `${quote.currency} ${quote.quotedTotal.toLocaleString('en-IN')}`
        : '[Agreed Total Amount]';

      return [
        `Dear ${vendorName},`,
        ``,
        `We are delighted to confirm that we would like to proceed with ${quoteTitle} for our celebration on ${event.date} at the agreed total of ${quoteTotal}.`,
        ``,
        `To ensure everything is aligned, here is the confirmed summary:`,
        `- Event Date: ${event.date}`,
        `- Expected Headcount: ${event.guestTarget} guests`,
        `- Total Quoted Amount: ${quoteTotal}`,
        ``,
        notes ? `Additional Agreed Details:\n${notes}\n` : '',
        `Please share your formal service agreement / contract draft along with your banking details for the booking retainer.`,
        ``,
        `Looking forward to partnering with you!`,
        ``,
        `Warm regards,`,
        `[Your Name]`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },

  expiry_extension: {
    title: 'Quotation Validity Extension Request',
    defaultSubject: (event, quote) =>
      `Validity Extension Request: ${quote?.title || 'Proposal'} — ${event.title}`,
    buildBody: (event, quote, notes) => {
      const vendorName = quote?.vendorName || '[Vendor Name]';
      const expiryDate = quote?.validUntilDate ? `on ${quote.validUntilDate}` : 'shortly';

      return [
        `Dear ${vendorName},`,
        ``,
        `Thank you again for your proposal for our event on ${event.date}.`,
        ``,
        `We note that the quotation validity expires ${expiryDate}. We are currently aligning final details with our key stakeholders and expect to make our final booking decision by [New Target Date, e.g. next Friday].`,
        ``,
        `Could you please grant a brief extension on the quoted terms and hold our date until [Requested Extension Date]?`,
        ``,
        notes ? `Context:\n${notes}\n` : '',
        `We appreciate your patience and will keep you closely informed.`,
        ``,
        `Warm regards,`,
        `[Your Name]`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },
};

/**
 * Extracts all `[placeholder text]` instances from a string.
 */
function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\[([^[\]]+)\]/g);
  if (!matches) return [];
  // Return unique placeholder strings with brackets
  return Array.from(new Set(matches));
}

/**
 * Generates an editable vendor message draft with highlighted placeholders.
 */
export function generateVendorMessageDraft(
  scenario: VendorMessageScenario,
  event: Event,
  quotation?: VendorQuotation,
  customNotes?: string
): VendorMessageDraft {
  const meta = SCENARIOS[scenario] || SCENARIOS.initial_inquiry;

  const subject = meta.defaultSubject(event, quotation);
  const body = meta.buildBody(event, quotation, customNotes);
  const unfilledPlaceholders = extractPlaceholders(body).concat(extractPlaceholders(subject));

  return {
    scenario,
    scenarioTitle: meta.title,
    subject,
    body,
    unfilledPlaceholders: Array.from(new Set(unfilledPlaceholders)),
  };
}
