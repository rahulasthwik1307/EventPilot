import { Event, Expense } from '@/features/events/types';
import {
  Vendor,
  VendorQuotation,
  VendorStatus,
} from '../types';

export interface QuoteDerivedProposalResult {
  canApply: boolean;
  validationError?: string;
  quotationUpdate: {
    id: string;
    status: 'accepted';
  };
  vendorProposal?: {
    vendorId: string;
    vendorName: string;
    isNewVendor: boolean;
    before?: {
      status: VendorStatus;
      quotedCost: number;
      agreedCost?: number;
    };
    after: {
      status: VendorStatus;
      quotedCost: number;
      agreedCost?: number;
    };
  };
  expenseProposal?: {
    expenseId: string;
    expenseTitle: string;
    before: {
      estimatedAmount: number;
      actualAmount?: number;
    };
    after: {
      estimatedAmount: number;
      actualAmount?: number;
    };
  };
  impactSummary: string;
}

/**
 * Creates a staged proposal to accept a quotation and optionally update the vendor book
 * and/or a linked budget expense, adhering to all contract and actuals invariants.
 */
export function createQuoteDerivedProposal(
  event: Event,
  quotation: VendorQuotation,
  options?: {
    promoteToAgreedContract?: boolean;
    targetExpenseId?: string;
  }
): QuoteDerivedProposalResult {
  // 1. Locate existing vendor if vendorId matches or by exact name
  const existingVendor = (event.vendors || []).find(
    (v) => (quotation.vendorId && v.id === quotation.vendorId) || v.name.toLowerCase() === quotation.vendorName.toLowerCase()
  );

  const promoteToAgreedContract = Boolean(options?.promoteToAgreedContract);

  // Contract floor check
  if (existingVendor) {
    if (existingVendor.status === 'booked' && existingVendor.agreedCost !== undefined) {
      // If promoting to agreed contract, new cost cannot be less than already disbursed cash
      if (promoteToAgreedContract && quotation.quotedTotal < existingVendor.amountPaid) {
        return {
          canApply: false,
          validationError: `Cannot set agreed contract to ${event.currency} ${quotation.quotedTotal.toLocaleString('en-IN')}: this vendor has already been paid ${event.currency} ${existingVendor.amountPaid.toLocaleString('en-IN')}. Actual disbursed funds form an immutable floor.`,
          quotationUpdate: { id: quotation.id, status: 'accepted' },
          impactSummary: 'Proposal rejected due to contract floor invariant violation.',
        };
      }
    }
  }

  // 2. Prepare vendor proposal
  let vendorProposal: QuoteDerivedProposalResult['vendorProposal'];

  if (existingVendor) {
    const nextStatus: VendorStatus = promoteToAgreedContract
      ? 'booked'
      : existingVendor.status === 'researching'
      ? 'quote_received'
      : existingVendor.status;

    vendorProposal = {
      vendorId: existingVendor.id,
      vendorName: existingVendor.name,
      isNewVendor: false,
      before: {
        status: existingVendor.status,
        quotedCost: existingVendor.quotedCost,
        agreedCost: existingVendor.agreedCost,
      },
      after: {
        status: nextStatus,
        quotedCost: quotation.quotedTotal,
        agreedCost: promoteToAgreedContract ? quotation.quotedTotal : existingVendor.agreedCost,
      },
    };
  } else {
    // Stage creating a new vendor record
    vendorProposal = {
      vendorId: quotation.vendorId || `vendor-${Date.now()}`,
      vendorName: quotation.vendorName,
      isNewVendor: true,
      after: {
        status: promoteToAgreedContract ? 'booked' : 'quote_received',
        quotedCost: quotation.quotedTotal,
        agreedCost: promoteToAgreedContract ? quotation.quotedTotal : undefined,
      },
    };
  }

  // 3. Prepare expense proposal if targetExpenseId specified
  let expenseProposal: QuoteDerivedProposalResult['expenseProposal'];

  if (options?.targetExpenseId) {
    const targetExpense = (event.expenses || []).find((e) => e.id === options.targetExpenseId);
    if (targetExpense) {
      const actualAmount = targetExpense.actualAmount || 0;
      // Invariant: estimatedAmount cannot be reduced below actual disbursement
      if (quotation.quotedTotal < actualAmount) {
        return {
          canApply: false,
          validationError: `Cannot reduce estimated expense "${targetExpense.title}" to ${event.currency} ${quotation.quotedTotal.toLocaleString('en-IN')}: actual paid amount is ${event.currency} ${actualAmount.toLocaleString('en-IN')}. Actual expenses cannot exceed estimated allocations.`,
          quotationUpdate: { id: quotation.id, status: 'accepted' },
          impactSummary: 'Proposal rejected: estimate cannot be lowered below actual disbursements.',
        };
      }

      expenseProposal = {
        expenseId: targetExpense.id,
        expenseTitle: targetExpense.title,
        before: {
          estimatedAmount: targetExpense.estimatedAmount,
          actualAmount: targetExpense.actualAmount,
        },
        after: {
          estimatedAmount: quotation.quotedTotal,
          actualAmount: targetExpense.actualAmount,
        },
      };
    }
  }

  // 4. Construct human-readable impact summary
  const summaryParts: string[] = [];
  summaryParts.push(`Accepting quotation "${quotation.title}" by ${quotation.vendorName} (${quotation.currency} ${quotation.quotedTotal.toLocaleString('en-IN')}).`);

  if (vendorProposal) {
    if (vendorProposal.isNewVendor) {
      summaryParts.push(`Adds ${quotation.vendorName} to the vendor book.`);
    } else if (promoteToAgreedContract) {
      summaryParts.push(`Updates ${quotation.vendorName} to booked status with agreed contract ${quotation.currency} ${quotation.quotedTotal.toLocaleString('en-IN')}.`);
    } else {
      summaryParts.push(`Updates ${quotation.vendorName}'s active quoted cost to ${quotation.currency} ${quotation.quotedTotal.toLocaleString('en-IN')}.`);
    }
  }

  if (expenseProposal) {
    summaryParts.push(`Adjusts budget expense "${expenseProposal.expenseTitle}" estimate from ${event.currency} ${expenseProposal.before.estimatedAmount.toLocaleString('en-IN')} to ${event.currency} ${expenseProposal.after.estimatedAmount.toLocaleString('en-IN')}.`);
  }

  return {
    canApply: true,
    quotationUpdate: {
      id: quotation.id,
      status: 'accepted',
    },
    vendorProposal,
    expenseProposal,
    impactSummary: summaryParts.join(' '),
  };
}

/**
 * Applies a verified quote-derived proposal to an event with optimistic concurrency protection.
 */
export function applyQuoteDerivedProposal(
  event: Event,
  proposal: QuoteDerivedProposalResult,
  options?: {
    expectedVersion?: number;
    expectedUpdatedAt?: string;
  }
): { updatedEvent: Event } | { error: string } {
  if (!proposal.canApply) {
    return { error: proposal.validationError || 'Proposal cannot be applied due to invariant violations.' };
  }

  // Concurrency check
  if (
    typeof options?.expectedVersion === 'number' &&
    typeof event.version === 'number' &&
    event.version !== options.expectedVersion
  ) {
    return {
      error: `Conflict detected: The event has been modified by another change (expected version ${options.expectedVersion}, found ${event.version}). Please refresh and try again.`,
    };
  }

  if (
    options?.expectedUpdatedAt &&
    event.updatedAt &&
    event.updatedAt !== options.expectedUpdatedAt
  ) {
    return {
      error: `Conflict detected: The event was updated at ${event.updatedAt} (expected ${options.expectedUpdatedAt}). Please refresh and try again.`,
    };
  }

  const nowIso = new Date().toISOString();
  const nextVersion = (event.version ?? 0) + 1;

  // 1. Update quotation status in event.quotations
  const quotations = (event.quotations || []).map((q) => {
    if (q.id === proposal.quotationUpdate.id) {
      return {
        ...q,
        status: 'accepted' as const,
        updatedAt: nowIso,
      };
    }
    return q;
  });

  // 2. Update or insert vendor
  let vendors = [...(event.vendors || [])];
  if (proposal.vendorProposal) {
    const vp = proposal.vendorProposal;
    const vendorIdx = vendors.findIndex((v) => v.id === vp.vendorId);
    if (vendorIdx >= 0) {
      vendors[vendorIdx] = {
        ...vendors[vendorIdx],
        status: vp.after.status,
        quotedCost: vp.after.quotedCost,
        agreedCost: vp.after.agreedCost ?? vendors[vendorIdx].agreedCost,
        updatedAt: nowIso,
      };
    } else {
      const newVendor: Vendor = {
        id: vp.vendorId,
        name: vp.vendorName,
        category: quotations.find((q) => q.id === proposal.quotationUpdate.id)?.serviceCategory || 'other',
        status: vp.after.status,
        quotedCost: vp.after.quotedCost,
        agreedCost: vp.after.agreedCost,
        depositPaid: 0,
        amountPaid: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      vendors.push(newVendor);
    }
  }

  // 3. Update expense if staged
  let expenses = [...(event.expenses || [])];
  if (proposal.expenseProposal) {
    const ep = proposal.expenseProposal;
    const expIdx = expenses.findIndex((e) => e.id === ep.expenseId);
    if (expIdx >= 0) {
      expenses[expIdx] = {
        ...expenses[expIdx],
        estimatedAmount: ep.after.estimatedAmount,
        updatedAt: nowIso,
      };
    }
  }

  const updatedEvent: Event = {
    ...event,
    quotations,
    vendors,
    expenses,
    version: nextVersion,
    updatedAt: nowIso,
  };

  return { updatedEvent };
}
