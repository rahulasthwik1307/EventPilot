# Glossary

Canonical domain vocabulary for Event Pilot. Use these terms consistently across code, tests, UI copy, and documentation. Database terminology describes domain concepts where relevant; it does not imply that a database is required in the initial release.

## Core Concepts

- **Event:** A planned gathering belonging to an Event Type (`wedding`, `birthday`, `community`). Contains an Event Date, Guest Target, Budget Cap, Currency, and other event-specific details. In the initial release, personal events are persisted locally in the user's browser.
- **Event Type:** One of the three supported event archetypes with distinct default planning models:
  - `wedding`: High vendor density, multi-ceremony timelines, complex seating and RSVP coordination.
  - `birthday`: Focused personal milestone with entertainment, catering, and age-appropriate themes.
  - `community`: Civic, neighborhood, or volunteer celebration with permits, task coordination, and multi-tier funding.
- **Budget Category:** A logical grouping of expenses (e.g. Venue, Catering, Decor, Photography, Entertainment, Logistics/Permits, Contingency) with an allocated planned amount.
- **Expense:** An individual monetary item within a Budget Category. Has an estimated cost, recorded actual cost, payment status (`projected`, `deposit_paid`, `settled`), and optional vendor link.
- **Deterministic Calculation Engine:** The pure TypeScript application logic responsible for authoritative arithmetic, category variances, cost-per-guest metrics, and calendar date calculations. AI models must not calculate authoritative monetary totals or dates.
- **Timeline Milestone:** A scheduled phase anchor calculated as a relative day offset (`offset_days`) from the Event Date (e.g. `-90` days).
- **Checklist Task:** An actionable to-do item associated with a Timeline Milestone or Vendor category, carrying priority, due date, and completion status.
- **Vendor Record:** A tracked service provider entry containing contact details, quoted prices, booking status, notes, and deposit milestones. Event Pilot is a private tracking tool, not an external booking agency or payment processor.
- **Guest:** An individual attendee associated with an optional invitation group, RSVP response (`pending`, `confirmed`, `declined`), meal preference, dietary information where provided, and optional table assignment.
- **Seating Table:** A physical or logical table with a defined capacity limit and assigned guests.
- **Staged Proposal:** An AI-generated set of recommendations (such as budget allocations, milestones, checklists, and ideas) held separately from the accepted event plan until the user reviews it. In the initial release, accepted changes are persisted to local browser storage.
- **Diff Approval Flow:** The human-in-the-loop interaction where users compare proposed AI updates against current event state, allowing selective acceptance, editing, or dismissal. The specific visual presentation is determined by the design system and interaction requirements.

## Persistence and Demo Concepts

- **Sample Event:** A clearly labeled, resettable example used to explore Event Pilot. Sample data must remain isolated from personal events.
- **Personal Event:** An event created or edited by the user, separate from the Sample Event.
- **Local Persistence:** Saving and restoring personal event data using browser `localStorage`. It is limited to the same browser profile and origin and does not provide cloud synchronization or a backup.
- **Persistence Failure:** An inability to save or restore local data because storage is unavailable, full, malformed, or incompatible. The application must provide understandable feedback and avoid silently destroying recoverable data.
- **Initial Release:** The local-first version of Event Pilot. It does not require registration, authentication, Supabase, PostgreSQL, or another application database.

## AI and Trust Concepts

- **AI-Generated Recommendation:** A suggestion produced by the planning assistant. It is not an authoritative fact or an accepted change until reviewed by the user.
- **Accepted Change:** A proposal or edit explicitly approved by the user and applied to the relevant event state.
- **Actual Expense:** A financial amount recorded by the user as an actual cost. It must not be silently overwritten by an AI-generated estimate.
- **User-Entered Value:** Information explicitly entered or edited by the user. Preserve it when regenerating proposals or recalculating dependent values unless the user explicitly chooses to change it.
