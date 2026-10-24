import {
  VendorQuotation,
  VendorCategory,
  QuotationComparisonResult,
  QuotationComparisonFinding,
} from '../types';

/**
 * Normalizes a deliverable string for comparison (lowercase, trimmed, stripped of punctuation).
 */
function normalizeDeliverableText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministically compares 2 or more vendor quotations for the same category.
 * Never converts or guesses currencies; highlights facts, variances, exclusions, and missing terms.
 */
export function compareVendorQuotations(
  quotations: VendorQuotation[],
  preferredCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR'
): QuotationComparisonResult {
  const generatedAt = new Date().toISOString();

  if (!quotations || quotations.length === 0) {
    return {
      category: 'other',
      quotations: [],
      currency: preferredCurrency,
      hasCurrencyMismatch: false,
      basePriceComparison: {
        lowestQuotedTotal: 0,
        highestQuotedTotal: 0,
        variance: 0,
      },
      scopeAlignment: {
        commonDeliverables: [],
        uniqueDeliverables: {},
      },
      exclusionsAnalysis: {
        explicitExclusions: {},
        missingInformation: {},
      },
      findings: [],
      generatedAt,
    };
  }

  const category = quotations[0].serviceCategory;
  const currencies = Array.from(new Set(quotations.map((q) => q.currency)));
  const hasCurrencyMismatch = currencies.length > 1;
  const dominantCurrency = quotations[0].currency;

  const findings: QuotationComparisonFinding[] = [];

  // Currency mismatch check
  if (hasCurrencyMismatch) {
    findings.push({
      dimension: 'price',
      summary: 'Currency Mismatch Detected',
      detail: `Quotations use differing currencies (${currencies.join(', ')}). Totals cannot be directly netted without accurate FX rates. Evaluate each quote in its native denomination.`,
      isAiInterpretation: false,
      sourceEvidence: `Currencies: ${currencies.join(', ')}`,
      severity: 'warning',
    });
  }

  // Price calculations
  let lowestQuotedTotal = 0;
  let highestQuotedTotal = 0;
  let variance = 0;

  if (!hasCurrencyMismatch) {
    const totals = quotations.map((q) => q.quotedTotal);
    lowestQuotedTotal = Math.min(...totals);
    highestQuotedTotal = Math.max(...totals);
    variance = Math.round((highestQuotedTotal - lowestQuotedTotal) * 100) / 100;

    if (quotations.length > 1 && variance > 0) {
      const cheapestQuote = quotations.find((q) => q.quotedTotal === lowestQuotedTotal)!;
      const expensiveQuote = quotations.find((q) => q.quotedTotal === highestQuotedTotal)!;
      const pctDiff = Math.round((variance / lowestQuotedTotal) * 100);

      findings.push({
        dimension: 'price',
        summary: `Price Variance of ${dominantCurrency} ${variance.toLocaleString('en-IN')} (${pctDiff}%)`,
        detail: `The lowest quote is "${cheapestQuote.title}" by ${cheapestQuote.vendorName} at ${dominantCurrency} ${lowestQuotedTotal.toLocaleString('en-IN')}, while the highest is "${expensiveQuote.title}" by ${expensiveQuote.vendorName} at ${dominantCurrency} ${highestQuotedTotal.toLocaleString('en-IN')}.`,
        isAiInterpretation: false,
        sourceEvidence: `${cheapestQuote.vendorName} (${cheapestQuote.quotedTotal}) vs ${expensiveQuote.vendorName} (${expensiveQuote.quotedTotal})`,
        severity: pctDiff > 35 ? 'warning' : 'info',
      });
    }
  }

  // Tax and fee inclusion analysis
  quotations.forEach((quote) => {
    const unincludedTaxes = quote.taxesAndFees.filter((t) => !t.isIncludedInTotal);
    if (unincludedTaxes.length > 0) {
      const unincludedSum = unincludedTaxes.reduce((sum, t) => sum + t.amount, 0);
      findings.push({
        dimension: 'price',
        summary: `Unincluded Taxes/Fees in ${quote.vendorName}'s Quote`,
        detail: `Quote "${quote.title}" lists additional taxes/fees not bundled into the quoted headline total: ${unincludedTaxes.map((t) => `${t.name} (${quote.currency} ${t.amount})`).join(', ')}. Effective total is ${quote.currency} ${(quote.quotedTotal + unincludedSum).toLocaleString('en-IN')}.`,
        isAiInterpretation: false,
        sourceEvidence: `Taxes excluded from quoted total: ${unincludedSum}`,
        severity: 'warning',
      });
    }
  });

  // Scope Deliverables Alignment
  const quoteServicesMap: Record<string, string[]> = {};
  const normalizedToOriginal: Record<string, string> = {};
  const serviceOccurrence: Record<string, Set<string>> = {};

  quotations.forEach((q) => {
    quoteServicesMap[q.id] = [];
    q.includedServices.forEach((s) => {
      const norm = normalizeDeliverableText(s.description);
      if (!norm) return;
      quoteServicesMap[q.id].push(s.description);
      if (!normalizedToOriginal[norm]) {
        normalizedToOriginal[norm] = s.description;
      }
      if (!serviceOccurrence[norm]) {
        serviceOccurrence[norm] = new Set();
      }
      serviceOccurrence[norm].add(q.id);
    });
  });

  const commonDeliverables: string[] = [];
  const uniqueDeliverables: Record<string, string[]> = {};
  quotations.forEach((q) => {
    uniqueDeliverables[q.id] = [];
  });

  // Identify common deliverables across all quotes
  Object.keys(serviceOccurrence).forEach((norm) => {
    const quotesWithService = serviceOccurrence[norm];
    if (quotations.length > 1 && quotesWithService.size === quotations.length) {
      commonDeliverables.push(normalizedToOriginal[norm]);
    }
  });

  // Identify unique deliverables per quote
  quotations.forEach((q) => {
    q.includedServices.forEach((s) => {
      const norm = normalizeDeliverableText(s.description);
      if (norm && serviceOccurrence[norm] && serviceOccurrence[norm].size === 1) {
        uniqueDeliverables[q.id].push(s.description);
      }
    });

    if (uniqueDeliverables[q.id].length > 0) {
      findings.push({
        dimension: 'scope',
        summary: `Unique Inclusions by ${q.vendorName} (${uniqueDeliverables[q.id].length})`,
        detail: `${q.vendorName} includes services not offered in the other quotes: ${uniqueDeliverables[q.id].slice(0, 3).join(', ')}${uniqueDeliverables[q.id].length > 3 ? '...' : ''}.`,
        isAiInterpretation: false,
        sourceEvidence: `${uniqueDeliverables[q.id].join('; ')}`,
        severity: 'info',
      });
    }
  });

  // Exclusions Analysis
  const explicitExclusions: Record<string, string[]> = {};
  const missingInformation: Record<string, string[]> = {};

  const todayStr = new Date().toISOString().split('T')[0];

  quotations.forEach((q) => {
    explicitExclusions[q.id] = q.exclusions || [];
    missingInformation[q.id] = [];

    // Explicit exclusions finding
    if (q.exclusions && q.exclusions.length > 0) {
      findings.push({
        dimension: 'exclusions',
        summary: `Explicit Exclusions for ${q.vendorName}`,
        detail: `The quote explicitly excludes: ${q.exclusions.join(', ')}. Additional vendor arrangements or budget may be required.`,
        isAiInterpretation: false,
        sourceEvidence: q.exclusions.join('; '),
        severity: 'info',
      });
    }

    // Missing term checks
    if (!q.validUntilDate) {
      missingInformation[q.id].push('Quotation validity / expiry date missing');
    } else if (q.validUntilDate < todayStr) {
      findings.push({
        dimension: 'validity',
        summary: `Quotation Expired (${q.vendorName})`,
        detail: `Quote "${q.title}" expired on ${q.validUntilDate}. Pricing and availability may need re-confirmation before booking.`,
        isAiInterpretation: false,
        sourceEvidence: `validUntilDate: ${q.validUntilDate}`,
        severity: 'alert',
      });
    }

    if (!q.cancellationPolicy) {
      missingInformation[q.id].push('Cancellation and refund terms not specified');
    }

    if (!q.depositRequired && (!q.paymentMilestones || q.paymentMilestones.length === 0)) {
      missingInformation[q.id].push('Deposit amount or payment milestone schedule missing');
    }

    if (q.serviceCategory === 'catering' && !q.guestCountAssumption) {
      missingInformation[q.id].push('Guest count assumption not stated for catering quote');
    }

    if (missingInformation[q.id].length > 0) {
      findings.push({
        dimension: 'scope',
        summary: `Missing Information in ${q.vendorName}'s Quote`,
        detail: `To compare fairly, request clarification on: ${missingInformation[q.id].join(', ')}.`,
        isAiInterpretation: false,
        sourceEvidence: missingInformation[q.id].join('; '),
        severity: 'warning',
      });
    }

    // Payment milestones check
    if (q.depositRequired && q.depositRequired > 0) {
      const depositPct = Math.round((q.depositRequired / q.quotedTotal) * 100);
      if (depositPct > 50) {
        findings.push({
          dimension: 'payment_terms',
          summary: `High Advance Deposit Required by ${q.vendorName} (${depositPct}%)`,
          detail: `Requires an upfront deposit of ${q.currency} ${q.depositRequired.toLocaleString('en-IN')} (${depositPct}% of total). Typical industry deposit is 20% to 50%.`,
          isAiInterpretation: false,
          sourceEvidence: `Deposit: ${q.depositRequired} of ${q.quotedTotal}`,
          severity: 'warning',
        });
      }
    }
  });

  return {
    category,
    quotations,
    currency: dominantCurrency,
    hasCurrencyMismatch,
    basePriceComparison: {
      lowestQuotedTotal,
      highestQuotedTotal,
      variance,
    },
    scopeAlignment: {
      commonDeliverables,
      uniqueDeliverables,
    },
    exclusionsAnalysis: {
      explicitExclusions,
      missingInformation,
    },
    findings,
    generatedAt,
  };
}

/**
 * Appends AI-generated qualitative interpretations to a comparison result.
 * Strictly marks all incoming AI findings with `isAiInterpretation: true`.
 */
export function mergeAiComparisonInsights(
  result: QuotationComparisonResult,
  aiFindings: Array<Omit<QuotationComparisonFinding, 'isAiInterpretation'>>
): QuotationComparisonResult {
  const typedAiFindings: QuotationComparisonFinding[] = aiFindings.map((f) => ({
    ...f,
    isAiInterpretation: true,
  }));

  return {
    ...result,
    findings: [...result.findings, ...typedAiFindings],
  };
}
