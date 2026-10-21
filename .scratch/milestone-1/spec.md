# Specification: Milestone 1 — Core Event Experience & Local Persistence

**Slug:** `milestone-1`  
**Status:** In-Planning  
**Target Delivery:** Core Event Experience, Sample Sandbox, Event Creation, Workspace Shell, and Local-First Persistence (`localStorage`).

---

## 1. Product Vision & Scope Alignment

Event Pilot is an India-first celebration and event-planning studio inspired by the warmth, organization, and chronological clarity of a traditional almanac (**Panchang & Utsav Almanac**). 

Milestone 1 delivers the foundational interactive experience of Event Pilot:
1. **Welcome Experience:** A welcoming, editorial studio entry communicating the product purpose, offering quick entry to an explorable sample celebration, new event creation across three archetypes (`wedding`, `birthday`, `community`), and access to saved personal events.
2. **Preloaded Sample Event Sandbox:** A realistic, pre-populated celebration workspace that can be inspected, edited in-memory, and independently reset at any time without ever affecting personal user data.
3. **Personal Event Creation:** A validated, accessible setup flow collecting essential event metadata (type, title, date, location, guest target, budget cap, currency defaulting to INR, and optional cultural/planning preferences) with plain-language feedback.
4. **Personal Event Workspace:** An editorial planning shell displaying event identity, countdowns, budget metrics, and establishing the clear information architecture for future modules (`Budget Ledger`, `Timeline & Tasks`, `Vendors`, `Guests & Seating`, `AI Assistant`) with honest status representation.
5. **Robust Local-First Persistence:** Complete personal event lifecycle persisted in browser `localStorage` with versioned schema validation, quota/error resilience, SSR safety, sample data isolation, and clear user indicators.

### Explicit Milestone 1 Exclusions
- **No cloud database:** No Supabase, PostgreSQL, or remote databases.
- **No authentication:** No user login, registration, or anonymous auth.
- **No Gemini API calls:** No live LLM calls in M1 (AI proposals will be introduced in subsequent milestones with diff approval drawers).
- **No external vendor marketplace or payment processing.**
- **No multi-device cloud sync:** Data remains private to the browser profile.

---

## 2. User Journeys & Page Structure

### Journey A: Exploring the Sample Celebration
1. User lands on the Event Pilot studio (`/`).
2. User clicks **"Explore Sample Event"** or selects one of the sample showcase cards.
3. The application loads the isolated sample event ("Aarav & Meera's Vivaha Celebration", 350 guests, ₹25,00,000 budget, Bangalore).
4. A prominent banner indicates: *"Sample Event · Sandbox Mode · Edits here are isolated and will not affect your personal events"*.
5. The user can explore the workspace overview, inspect budget allocations and timeline countdowns, and click **"Reset Sample"** to restore original starter data at any time.

### Journey B: Creating a Personal Event
1. User clicks **"Create New Event"** from the Welcome page or Workspace header.
2. An accessible modal dialog opens:
   - Step 1: Select Event Type (`wedding`, `birthday`, `community`).
   - Step 2: Enter Event Title (required, 3–100 characters).
   - Step 3: Enter Event Date (`YYYY-MM-DD`, required, valid calendar date).
   - Step 4: Enter Location (optional, e.g. "Bengaluru, Karnataka").
   - Step 5: Enter Expected Guest Target (required, positive integer).
   - Step 6: Enter Budget Cap (required, positive number) & Currency (default `INR (₹)`).
   - Step 7: Optional cultural context or celebration preferences (opt-in, never assumed).
3. Plain-language validation validates inputs on submit. If invalid, field-level error messages are displayed without clearing user input.
4. On success, the event is saved to `localStorage` under `event_pilot_personal_events_v1`, set as the active event, and the user is transitioned to their new event workspace.

### Journey C: Managing and Editing Saved Personal Events
1. In the personal event workspace, the user views their event details, countdown, and budget metrics.
2. The user clicks **"Edit Event Details"** to modify title, date, location, guest target, budget, or preferences.
3. Changes are validated and saved immediately to `localStorage`. A tactile status indicator indicates *"Saved locally at [time]"*.
4. The user can switch between saved personal events or return to the Welcome page.
5. If the user chooses to delete their event, an explicit confirmation modal explains that local data will be permanently removed. Upon confirmation, the event is deleted from storage.

---

## 3. Domain Model & Local Persistence Lifecycle

### 3.1 Domain Model (`src/features/events/types.ts`)
```typescript
export type EventType = 'wedding' | 'birthday' | 'community';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface EventCulturalContext {
  traditionOrTheme?: string;
  notes?: string;
}

export interface BudgetSummary {
  budgetCap: number;
  allocatedAmount: number;
  actualSpent: number;
  currency: CurrencyCode;
}

export interface Event {
  id: string; // UUID v4 or crypto.randomUUID
  type: EventType;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  location?: string;
  guestTarget: number;
  budgetCap: number;
  currency: CurrencyCode;
  culturalContext?: EventCulturalContext;
  isSample?: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: 'QUOTA_EXCEEDED' | 'STORAGE_UNAVAILABLE' | 'PARSE_ERROR' | 'VERSION_MISMATCH' | 'NOT_FOUND' | 'UNKNOWN';
    message: string;
  };
}
```

### 3.2 Storage Layout & Versioning
- **Schema Version:** `1`
- **Keys:**
  - `event_pilot_personal_events_v1`: Array of `Event` objects (`Event[]`)
  - `event_pilot_sample_v1`: Single `Event` object representing sample state
  - `event_pilot_active_id_v1`: ID of the currently selected active event
- **Deterministic Pure TS Validation:**
  - `validateEvent(data: unknown): { valid: true; event: Event } | { valid: false; errors: string[] }`
  - Verifies types, bounds, string lengths, valid YYYY-MM-DD date math without timezone drift.

### 3.3 Storage Resilience & Error Handling
1. **SSR Safety:** `isStorageAvailable()` guard prevents execution on server render or disabled storage environments.
2. **Quota Handling:** Catches `QuotaExceededError` (`DOMException.QUOTA_EXCEEDED_ERR`) and surfaces friendly alerts without crashing.
3. **Corrupted Data:** Malformed JSON or schema version mismatches are captured safely. Corrupted data is never silently wiped; the user is alerted with recovery options.
4. **Isolation:** Mutating the sample event writes only to `event_pilot_sample_v1`. Resetting the sample restores pristine initial data and never touches `event_pilot_personal_events_v1`.

---

## 4. UI/UX Architecture & Impeccable Design Requirements

In accordance with `DESIGN.md`, `.impeccable/design.json`, and `.impeccable/surfaces/app.md`:
- **Visual Thesis:** Panchang & Utsav Almanac — warm papyrus canvas (`#FDFBF7`), clean card surfaces (`#FFFFFF`), sandstone secondary surfaces (`#F5EFEB`), ceremonial hairline borders (`#E7DFD5`), deep charcoal ink (`#1C1917`), and marigold amber (`#D97706`).
- **Typography:**
  - Display: `Eczar` (600 weight) for editorial headings.
  - Body & UI: `Plus Jakarta Sans` for labels, descriptions, and buttons.
  - Numerals: `JetBrains Mono` with `tabular-nums` for currency, dates, countdowns, and guest metrics.
- **Button Contrast Compliance:**
  - Primary button: Background `#D97706` with Deep Ink `#1C1917` text (WCAG 2.1 AA certified).
  - Hover: `#B45309` with `#FFFFFF` text.
- **Coupon Stamp Badges:**
  - Stylized tactile status tags (`#FFEDD5` bg, `#C2410C` text, dashed hairline) for recorded states (e.g. `SAMPLE SANDBOX`, `SAVED LOCALLY`).
- **Layout & Responsiveness:**
  - Wide desktop (>= 1280px): Stepped navigation rail, prominent event header with aligned metadata, structured ledger cards.
  - Tablet (768px - 1024px): Compact header, collapsible navigation, stacked ledger metrics.
  - Mobile (< 768px): Deliberate mobile-first flow, sticky or thumb-accessible bottom controls, touch-friendly tap targets (>= 44px).
- **Honest Module States:**
  - Milestone 1 implements the core `Overview` workspace.
  - Future tabs (`Budget Ledger`, `Timeline & Tasks`, `Vendors`, `Guests & Seating`, `AI Assistant`) are visible to establish the information architecture, but explicitly display clean, honest planned status indicators rather than fake interactive mockups.

---

## 5. Acceptance Criteria Matrix (Six Mandatory Evaluator Parameters)

| Parameter | Weight | Acceptance Criteria | Verification Method |
|---|---|---|---|
| **1. Code Quality** | High | Strict TypeScript (no `any`), modular domain/storage separation, deterministic date and financial arithmetic, clean Next.js App Router structure, zero lint or type errors. | `npm run typecheck`, ESLint, architectural review. |
| **2. Security** | Medium | No API keys or credentials stored or logged; browser storage treated as untrusted input; safe JSON parse with strict validation; no XSS; clear local storage privacy notice. | Storage validation unit tests, static code audit. |
| **3. Efficiency** | Medium | No unneeded dependencies (pure TS validation, existing lucide icons and tailwind); fast initial render; client components isolated to interactive boundaries; zero unnecessary re-renders. | `npm run build` static generation, bundle check. |
| **4. Testing** | Low (Req) | Comprehensive Vitest suite: domain validation (valid/invalid inputs, date boundaries), storage adapter (CRUD, quota, corruption, sample isolation, reset), UI component tests. | `npm test` passing with 100% green test assertions. |
| **5. Accessibility** | Low (Req) | WCAG 2.1 AA: 4.5:1 text contrast, Deep Ink on Marigold, semantic HTML (`h1`-`h3`, `<nav>`, `<main>`), form labels, ARIA error announcements, focus traps on dialogs, keyboard navigation. | Automated DOM checks & keyboard navigation test. |
| **6. Problem Alignment** | Very High | Distinct celebration-planning studio (weddings, birthdays, community); sample celebration immediately explorable; personal event creation & local persistence; Panchang & Utsav Almanac design system. | Functional walkthrough & visual audit with Impeccable. |

---

## 6. Implementation Sequence

1. **Phase 1: Domain & Storage Foundation**
   - Implement `src/features/events/types.ts` (domain interfaces, storage results).
   - Implement `src/features/events/validation.ts` (pure deterministic validation, date calculations, currency formatting).
   - Implement `src/features/events/sample-event.ts` (comprehensive sample celebration fixture).
   - Implement `src/features/events/storage.ts` (browser `localStorage` adapter, error handling, quota handling, versioning, sample isolation).
   - Author unit tests `src/features/events/__tests__/validation.test.ts` and `src/features/events/__tests__/storage.test.ts`.

2. **Phase 2: UI Components (Design System Compliant)**
   - `src/components/ui/Badge.tsx` (coupon-style stamps and status pills).
   - `src/components/ui/Dialog.tsx` (accessible modal with focus trap, backdrop, and keyboard escape).
   - `src/components/welcome/WelcomeHero.tsx` (editorial studio introduction, quick actions).
   - `src/components/welcome/EventTypeCards.tsx` (wedding, birthday, community selector cards).
   - `src/components/welcome/SavedEventsList.tsx` (quick access to locally stored personal events).
   - `src/components/events/EventCreateDialog.tsx` (validated creation flow with accessible feedback).
   - `src/components/events/EventEditDialog.tsx` (edit event details dialog).
   - `src/components/workspace/WorkspaceHeader.tsx` (event title, date countdown, budget badge, actions).
   - `src/components/workspace/WorkspaceNavigation.tsx` (stepped tabs establishing navigation IA).
   - `src/components/workspace/OverviewTab.tsx` (event details card, planning metrics snapshot, honest future module teasers).
   - `src/components/workspace/SampleBanner.tsx` (sample sandbox indicator with independent reset).

3. **Phase 3: Integration & View Management**
   - Connect `src/app/page.tsx` with event state management (Welcome vs Active Workspace).
   - Ensure seamless switching between sample sandbox and personal events.
   - Display storage privacy disclaimer banner.

4. **Phase 4: Verification & Impeccable Review**
   - Run unit and integration tests with `npm test`.
   - Run `npm run typecheck` and `npm run build`.
   - Execute Impeccable review/critique workflows.
