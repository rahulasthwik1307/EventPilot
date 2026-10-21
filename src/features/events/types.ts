/**
 * Event Pilot Domain Types
 * Canonical domain vocabulary for Event Pilot:
 * Milestone 1 - Core Event Experience & Local Persistence
 * Milestone 2 - Budget Ledger and Timeline & Tasks Engine
 */

export type EventType = 'wedding' | 'birthday' | 'community';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface EventCulturalContext {
  traditionOrTheme?: string;
  notes?: string;
}

// --- Milestone 2: Budget Domain ---

export type PaymentStatus = 'projected' | 'deposit_paid' | 'settled';

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  color?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  title: string;
  estimatedAmount: number;
  actualAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  budgetCap: number;
  totalAllocated: number;
  totalEstimated: number;
  totalActual: number;
  unallocatedBudget: number; // budgetCap - totalAllocated
  budgetCapVariance: number; // budgetCap - totalActual
  costPerGuest: number;
  isOverAllocated: boolean; // totalAllocated > budgetCap
  isOverBudget: boolean; // totalActual > budgetCap
  currency: CurrencyCode;
}

export interface CategorySummary {
  category: BudgetCategory;
  allocatedAmount: number;
  totalEstimated: number;
  totalActual: number;
  variance: number; // allocatedAmount - totalActual
  expenseCount: number;
}

// --- Milestone 2: Timeline & Task Domain ---

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'completed';

export interface TimelineMilestone {
  id: string;
  title: string;
  offsetDays: number; // Relative to celebration date (e.g. -120, -30, 0)
  description?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
  milestoneId?: string;
  category?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD effective due date
  isDueDateOverridden?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Core Event Entity ---

export interface Event {
  id: string;
  type: EventType;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  location?: string;
  guestTarget: number;
  budgetCap: number;
  currency: CurrencyCode;
  culturalContext?: EventCulturalContext;
  isSample?: boolean;
  categories: BudgetCategory[];
  expenses: Expense[];
  milestones: TimelineMilestone[];
  tasks: ChecklistTask[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type EventInput = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt' | 'isSample' | 'categories' | 'expenses' | 'milestones' | 'tasks'
>;

// --- Validation & Result Types ---

export interface ValidationSuccess<T> {
  isValid: true;
  data: T;
  errors: Record<string, never>;
}

export interface ValidationFailure {
  isValid: false;
  data: null;
  errors: Record<string, string>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// --- Storage Result Types ---

export type StorageErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'QUOTA_EXCEEDED'
  | 'PARSE_ERROR'
  | 'VERSION_MISMATCH'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN';

export interface StorageError {
  code: StorageErrorCode;
  message: string;
  cause?: unknown;
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

export interface EventStorage {
  getPersonalEvents(): StorageResult<Event[]>;
  getPersonalEvent(id: string): StorageResult<Event | null>;
  savePersonalEvent(event: Event): StorageResult<void>;
  deletePersonalEvent(id: string): StorageResult<void>;
  getSampleEvent(): StorageResult<Event>;
  saveSampleEvent(event: Event): StorageResult<void>;
  resetSampleEvent(): StorageResult<Event>;
  getActiveEventId(): StorageResult<string | null>;
  setActiveEventId(id: string | null): StorageResult<void>;
}
