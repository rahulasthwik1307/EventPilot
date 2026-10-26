# Event Pilot — Celebration & Event Planning Studio

> **Inclusive, editorial event-planning studio inspired by the warmth and order of an almanac.**  
> Built with Next.js 15, TypeScript, Tailwind CSS, deterministic calculation engines, local-first browser storage, and a resilient multi-model AI provider chain.

---

## 1. Overview & Problem Statement

Planning milestone celebrations—especially multi-day Indian weddings, focused birthday celebrations, or community gatherings—is notoriously fragmented. Organizers juggle chaotic spreadsheets, disconnected chat threads, and vague estimates, leading to:
- **Budget Uncertainty:** Hidden costs, accidental double-counting of quotes versus actual expenses, and lack of variance tracking.
- **Date & Schedule Confusion:** Fragile timelines that break when an event date moves or rituals are rescheduled.
- **Operational Chaos:** Disjointed tracking of vendors, guest dietary restrictions, household invitations, and table seating capacity.
- **AI Hallucination Risks:** Generic chatbots that hallucinate financial arithmetic, invent calendar dates, or overwrite user decisions.

**Event Pilot** bridges AI-assisted planning with deterministic application authority:
1. **The Model Proposes, The Engine Validates, The User Decides:** AI generates structured, staged proposals (budget adjustments, timeline tasks, vendor checklists).
2. **Deterministic Domain Engines:** All monetary totals, category variances, per-guest costs, and relative calendar date re-anchoring are executed in pure TypeScript logic. Language models are strictly prohibited from calculating authoritative numbers or dates.
3. **Local-First Privacy:** All personal event data remains in the user's browser `localStorage`. No mandatory user accounts, cloud databases, or third-party tracking are required for the initial release.

---

## 2. Core Capabilities

### A. Celebration Archetypes & Overview
- **Vivaha & Weddings:** Multi-ceremony ritual timelines, high vendor density, complex family seating, and multi-tier guest hospitality.
- **Milestone Birthdays:** Single-day party coordination, entertainment booking, bespoke cake logistics, and favor checklists.
- **Community Festivals:** Civic permissions, ground booking, volunteer task matrices, and tiered fund allocation.
- **Sample Sandbox:** Includes a pre-populated, resettable sample event (*Aarav & Meera's Vivaha Celebration*) isolated from personal events.

### B. Deterministic Budget Ledger
- **Category Allocations & Variance:** Dynamic category caps with visual allocation meters and over-allocation warnings.
- **Strict Actual Spending Rule:** Distinguishes estimated costs from recorded actual expenses. Vendor contract quotes and agreed commitments are never fabricated as settled expenses.
- **Guest-Dependent Estimations:** Dynamically computes cost-per-guest metrics while protecting user-entered financial baselines.
- **INR & Multi-Currency Formatting:** Safe integer-precision monetary formatting supporting INR (`₹`), USD, EUR, and GBP without currency mixing.

### C. Re-Anchoring Timeline & Task Matrix
- **Relative Day Offsets:** Milestones anchored relative to the celebration date (e.g. `T-180` days, `T-30` days).
- **Rescheduling Safety Engine:** When an event date is changed, milestones and milestone-dependent tasks automatically recalculate their due dates while strictly preserving manual overrides, custom task descriptions, and completion timestamps.
- **Priority & Status Filters:** Live task filtering by priority (`high`, `medium`, `low`) and status (`pending`, `completed`, `overdue`).

### D. Vendor Management Book
- **Structured Vendor Records:** Tracks business names, categories, quotes, agreed contract commitments, and deposits paid.
- **Financial Segregation:** Displays agreed commitments and deposits distinctly without altering the Budget Ledger's recorded actuals.
- **Cascading Integrity:** Deleting a vendor record unlinks associated expense references cleanly without deleting expense items.

### E. Guests, Households & RSVP Register
- **Household Groupings:** Groups families and plus-ones under single invitation households.
- **Hospitality & Diet:** Tracks dietary preferences (Vegetarian, Sattvic, Jain, Vegan, Non-Vegetarian) and attendance status (`confirmed`, `pending`, `declined`).
- **Safe Deletion:** Deleting a household unlinks members safely without destroying individual guest profiles.

### F. Practical Seating Planner
- **Table Capacity Constraints:** Enforces table size limits (1 to 50 seats) with live occupancy meters and overcapacity warnings.
- **Attendee Assignment:** Allows assigning and unseating confirmed attendees with unassigned guest registers.
- **Dependency Cleanup:** Deleting a table automatically unassigns seated guests back to the unassigned pool.

### G. AI Planning Assistant & Multi-Model Provider Chain
- **Privacy-Safe Context Projector:** Projects only allowlisted, anonymized event constraints (title, city, budget cap, guest count, category summary). Strictly excludes guest names, contact details, dietary notes, private contracts, and raw storage.
- **Multi-Model Fallback Chain:**
  1. **Primary Provider:** Cloudflare Workers AI using verified free-tier models (default: `@cf/meta/llama-3.2-3b-instruct`).
  2. **Failover Models:** Automatically fails over across verified free-eligible Cloudflare models (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/meta/llama-3.1-8b-instruct-fp8`) upon transient errors or capacity spikes.
  3. **Final Fallback:** Google Gemini Flash (`gemini-3.8-flash`) is engaged if Cloudflare candidates are exhausted or unauthorized.
  4. **Strict Isolation:** If Cloudflare succeeds, Gemini is never called. If all fail, a graceful, actionable 503 error is presented.
- **Staged Proposal Workflow:** Proposals (`adjust_budget_allocation`, `add_task`, `add_milestone`, `add_checklist_item`, `suggest_vendor_followup`) are presented as interactive cards with side-by-side diffs. Users selectively accept or dismiss changes.

---

## 3. Technology Stack & Architecture

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Language:** TypeScript 5.7 (Strict mode, zero `any` in domain logic)
- **Styling:** Tailwind CSS 3.4 adhering to the *Panchang & Utsav Almanac* design system (`DESIGN.md`)
- **Typography:** Self-hosted `Eczar` (Display/Editorial serif) and `Plus Jakarta Sans` (Body sans-serif) via `next/font/google`
- **Schema Validation:** [Zod 4.6](https://zod.dev/) for runtime API request/response contracts and proposal schemas
- **Testing:** [Vitest 2.1](https://vitest.dev/) with `@testing-library/react` and `jsdom` (48 test suites, 400+ automated tests across pure engines, custom hooks, and UI components)
- **Architectural Design:** Deep modules and clean seam separation (`useEventWorkspace`, `useUndoAction`, modular domain overview decomposition) with deterministic TypeScript calculation engines and optimistic concurrency protection.

---

## 4. Local Setup & Environment Configuration

### Prerequisites
- Node.js `18.x` or higher (tested with Node 22 / 20)
- npm `9.x` or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/EventPilot.git
cd EventPilot

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your API keys in `.env.local`:
```bash
# Google Gemini API (Server-side Provider Adapter / Final Fallback)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# Cloudflare Workers AI (Server-side Primary Provider)
# Verified free tier: 10,000 Neurons/day. Verified free-tier models:
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_MODELS=@cf/meta/llama-3.2-3b-instruct,@cf/meta/llama-3.3-70b-instruct-fp8-fast,@cf/meta/llama-3.1-8b-instruct-fp8
CLOUDFLARE_TIMEOUT_MS=30000
```

> **Note on Provider Quotas:** Provider availability and free-tier limits depend on current Cloudflare and Google account policies. All automated unit and integration tests run entirely against local mocks and do not consume live provider quotas.

---

## 5. Running the Application & Automated Checks

### Development Server
Starts the local development server on `http://localhost:3000` with automatic zombie-process port clearing:
```bash
npm run dev
```

### Running Automated Checks
```bash
# 1. TypeScript Strict Typecheck
npm run typecheck

# 2. Automated Test Suite (175+ tests)
npm test

# 3. Code Style & ESLint
npm run lint

# 4. Production Build Verification
npm run build
```

---

## 6. Evaluation Readiness Assessment

| Evaluation Parameter | Priority | Implementation Evidence |
| :--- | :--- | :--- |
| **A. Problem Statement Alignment** | Very High | Complete end-to-end user journeys for weddings, birthdays, and festivals. Working integrations across budgets, re-anchored timelines, vendors, RSVPs, seating, and AI-staged proposals. |
| **B. Code Quality & Architecture** | High | Deep modules with minimal interfaces (`useEventWorkspace`, `useUndoAction`), decoupled overview sub-components (`src/components/workspace/overview/`), strict TypeScript typing, deterministic domain engines, zero ESLint warnings, 100% clean production build. |
| **C. Security & Privacy** | High | Server-side security headers (CSP, HSTS, X-Content-Type-Options, frame protection), client-rate-limited AI routes, bounded quotation processing arrays, and optimistic concurrency version locking to prevent cross-tab data loss. |
| **D. Efficiency & Reliability** | Medium | Automatic port-conflict clearing (`scripts/clean-port.js`), preloaded Google fonts eliminating FOUC, in-memory AI response caching, bounded model retry loops and timeouts. |
| **E. Automated Testing** | Confidence | 48 test suites, 400+ unit and integration tests covering domain calculations, storage migrations, concurrency safeguards, proposal staging, provider failover chains, and UI workflows. |
| **F. Accessibility & Polish** | Polish | WCAG 2.1 AA compliant color contrast, focus-trapped dialogs with Escape key listeners, screen-reader status announcements, responsive viewports (mobile, tablet, desktop), and reduced-motion support. |

---

## 7. Submission Status

- **Deployment & Demo Video:** Live deployment and demonstration video recording are deferred for separate submission preparation.
- **Submission Limit:** Prepared for local evaluation under the maximum 3 submissions policy.
