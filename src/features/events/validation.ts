/**
 * Event Pilot Deterministic Validation & Calculation Engine
 * Guardrail: All financial arithmetic, date math, and attendance calculations
 * must live in deterministic TypeScript logic.
 */

import {
  BudgetCategory,
  ChecklistTask,
  CurrencyCode,
  Event,
  EventInput,
  EventType,
  Expense,
  TimelineMilestone,
  ValidationResult,
} from './types';

const VALID_EVENT_TYPES: EventType[] = ['wedding', 'birthday', 'community'];
const VALID_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

/**
 * Validates whether a string is a strict YYYY-MM-DD calendar date
 * and represents a real calendar day (e.g. rejects 2026-02-30).
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Verify month day boundaries (leap years, 30 vs 31 days)
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Deterministic calendar day difference between a YYYY-MM-DD target date
 * and a reference date, preventing UTC day shifting.
 */
export function calculateDaysRemaining(targetDateStr: string, referenceDate: Date = new Date()): number {
  if (!isValidCalendarDate(targetDateStr)) return 0;

  const [y, m, d] = targetDateStr.split('-').map((v) => parseInt(v, 10));
  const utcTarget = Date.UTC(y, m - 1, d);

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();
  const utcRef = Date.UTC(refYear, refMonth, refDay);

  const diffMs = utcTarget - utcRef;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD date into human-readable editorial text
 * without timezone drift. E.g. "2026-11-20" -> "20 November 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!isValidCalendarDate(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Deterministic monetary currency formatter.
 * For INR, uses the Indian numbering system format (₹25,00,000).
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  if (!Number.isFinite(amount)) return `${getCurrencySymbol(currency)}0`;

  const absAmount = Math.round(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';

  if (currency === 'INR') {
    // Indian numbering format: 3 digits, then groups of 2 digits
    const str = absAmount.toString();
    if (str.length <= 3) {
      return `${sign}₹${str}`;
    }
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${sign}₹${formattedOther},${lastThree}`;
  }

  const symbol = getCurrencySymbol(currency);
  const formatted = absAmount.toLocaleString('en-US');
  return `${sign}${symbol}${formatted}`;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '₹';
  }
}

/**
 * Validates input for creating or editing an event.
 */
export function validateEventInput(raw: unknown): ValidationResult<EventInput> {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== 'object') {
    return {
      isValid: false,
      data: null,
      errors: { form: 'Event data must be a valid object.' },
    };
  }

  const input = raw as Record<string, unknown>;

  // 1. Event Type
  const type = input.type as EventType;
  if (!type || !VALID_EVENT_TYPES.includes(type)) {
    errors.type = 'Please select a valid event archetype: Wedding, Birthday, or Community.';
  }

  // 2. Title
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    errors.title = 'Event title is required.';
  } else if (title.length < 3) {
    errors.title = 'Event title must be at least 3 characters.';
  } else if (title.length > 100) {
    errors.title = 'Event title must not exceed 100 characters.';
  }

  // 3. Date
  const dateStr = typeof input.date === 'string' ? input.date.trim() : '';
  if (!dateStr) {
    errors.date = 'Event date is required.';
  } else if (!isValidCalendarDate(dateStr)) {
    errors.date = 'Please enter a valid calendar date in YYYY-MM-DD format.';
  }

  // 4. Location (Optional)
  const location = typeof input.location === 'string' ? input.location.trim() : undefined;
  if (location && location.length > 150) {
    errors.location = 'Location must not exceed 150 characters.';
  }

  // 5. Guest Target
  const guestTargetRaw = input.guestTarget;
  const guestTarget = typeof guestTargetRaw === 'number' ? guestTargetRaw : Number(guestTargetRaw);
  if (!Number.isFinite(guestTarget) || !Number.isInteger(guestTarget) || guestTarget <= 0) {
    errors.guestTarget = 'Expected guest count must be a positive whole number.';
  } else if (guestTarget > 100000) {
    errors.guestTarget = 'Guest target cannot exceed 100,000.';
  }

  // 6. Budget Cap
  const budgetCapRaw = input.budgetCap;
  const budgetCap = typeof budgetCapRaw === 'number' ? budgetCapRaw : Number(budgetCapRaw);
  if (!Number.isFinite(budgetCap) || budgetCap <= 0) {
    errors.budgetCap = 'Budget cap must be a positive amount.';
  } else if (budgetCap > 1000000000) {
    errors.budgetCap = 'Budget cap cannot exceed ₹1,00,00,00,000 (100 Crore).';
  }

  // 7. Currency
  const currency = (input.currency as CurrencyCode) || 'INR';
  if (!VALID_CURRENCIES.includes(currency)) {
    errors.currency = 'Currency must be one of INR, USD, EUR, or GBP.';
  }

  // 8. Cultural Context (Optional)
  let culturalContext: Event['culturalContext'];
  if (input.culturalContext && typeof input.culturalContext === 'object') {
    const ctx = input.culturalContext as Record<string, unknown>;
    const traditionOrTheme = typeof ctx.traditionOrTheme === 'string' ? ctx.traditionOrTheme.trim() : undefined;
    const notes = typeof ctx.notes === 'string' ? ctx.notes.trim() : undefined;
    if (traditionOrTheme || notes) {
      culturalContext = { traditionOrTheme, notes };
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      data: null,
      errors,
    };
  }

  return {
    isValid: true,
    data: {
      type,
      title,
      date: dateStr,
      location: location || undefined,
      guestTarget,
      budgetCap,
      currency,
      culturalContext,
    },
    errors: {},
  };
}

/**
 * Validates a persisted or loaded Event object.
 */
export function validateEvent(data: unknown): ValidationResult<Event> {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      data: null,
      errors: { root: 'Invalid event data payload.' },
    };
  }

  const obj = data as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id.trim() : '';
  if (!id) {
    return {
      isValid: false,
      data: null,
      errors: { id: 'Event is missing a valid identifier.' },
    };
  }

  const inputValidation = validateEventInput(obj);
  if (!inputValidation.isValid) {
    return {
      isValid: false,
      data: null,
      errors: inputValidation.errors,
    };
  }

  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString();
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : createdAt;
  const isSample = Boolean(obj.isSample);

  let categories: BudgetCategory[] = [];
  if (Array.isArray(obj.categories) && obj.categories.length > 0) {
    categories = obj.categories
      .filter((c) => c && typeof c === 'object' && typeof (c as Record<string, unknown>).name === 'string')
      .map((c, i) => {
        const item = c as Record<string, unknown>;
        return {
          id: typeof item.id === 'string' && item.id ? item.id : `cat-${i + 1}`,
          name: String(item.name).trim(),
          allocatedAmount: Number.isFinite(item.allocatedAmount) ? Math.max(0, Math.round(Number(item.allocatedAmount))) : 0,
          color: typeof item.color === 'string' ? item.color : undefined,
        };
      });
  }

  let expenses: Expense[] = [];
  if (Array.isArray(obj.expenses)) {
    expenses = obj.expenses
      .filter((e) => e && typeof e === 'object' && typeof (e as Record<string, unknown>).title === 'string')
      .map((e, i) => {
        const item = e as Record<string, unknown>;
        const paymentStatus = ['projected', 'deposit_paid', 'settled'].includes(item.paymentStatus as string)
          ? (item.paymentStatus as Expense['paymentStatus'])
          : 'projected';
        return {
          id: typeof item.id === 'string' && item.id ? item.id : `exp-${i + 1}`,
          categoryId: typeof item.categoryId === 'string' ? item.categoryId : '',
          title: String(item.title).trim(),
          estimatedAmount: Number.isFinite(item.estimatedAmount) ? Math.max(0, Math.round(Number(item.estimatedAmount))) : 0,
          actualAmount: typeof item.actualAmount === 'number' && Number.isFinite(item.actualAmount)
            ? Math.max(0, Math.round(item.actualAmount))
            : undefined,
          paymentStatus,
          notes: typeof item.notes === 'string' ? item.notes : undefined,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : createdAt,
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : createdAt,
        };
      });
  }

  let milestones: TimelineMilestone[] = [];
  if (Array.isArray(obj.milestones) && obj.milestones.length > 0) {
    milestones = obj.milestones
      .filter((m) => m && typeof m === 'object' && typeof (m as Record<string, unknown>).title === 'string')
      .map((m, i) => {
        const item = m as Record<string, unknown>;
        return {
          id: typeof item.id === 'string' && item.id ? item.id : `m-${i + 1}`,
          title: String(item.title).trim(),
          offsetDays: Number.isFinite(item.offsetDays) ? Number(item.offsetDays) : 0,
          description: typeof item.description === 'string' ? item.description : undefined,
        };
      });
  }

  let tasks: ChecklistTask[] = [];
  if (Array.isArray(obj.tasks)) {
    tasks = obj.tasks
      .filter((t) => t && typeof t === 'object' && typeof (t as Record<string, unknown>).title === 'string')
      .map((t, i) => {
        const item = t as Record<string, unknown>;
        const priority = ['low', 'medium', 'high', 'urgent'].includes(item.priority as string)
          ? (item.priority as ChecklistTask['priority'])
          : 'medium';
        const status = item.status === 'completed' ? 'completed' : 'pending';
        return {
          id: typeof item.id === 'string' && item.id ? item.id : `task-${i + 1}`,
          title: String(item.title).trim(),
          description: typeof item.description === 'string' ? item.description : undefined,
          milestoneId: typeof item.milestoneId === 'string' ? item.milestoneId : undefined,
          category: typeof item.category === 'string' ? item.category : undefined,
          priority,
          status,
          dueDate: typeof item.dueDate === 'string' ? item.dueDate : inputValidation.data.date,
          isDueDateOverridden: Boolean(item.isDueDateOverridden),
          completedAt: typeof item.completedAt === 'string' ? item.completedAt : undefined,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : createdAt,
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : createdAt,
        };
      });
  }

  return {
    isValid: true,
    data: {
      id,
      ...inputValidation.data,
      isSample,
      categories,
      expenses,
      milestones,
      tasks,
      createdAt,
      updatedAt,
    },
    errors: {},
  };
}
