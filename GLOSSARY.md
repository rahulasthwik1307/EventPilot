# Glossary

Canonical domain vocabulary for Event Pilot. Use these terms exactly across code, tests, database schemas, and documentation.

## Core Concepts

- **Event:** A planned milestone gathering belonging to an Event Type (`wedding`, `birthday`, `community`). Contains an Event Date, Guest Target, Budget Cap, and Currency.
- **Event Type:** One of the three supported event archetypes with distinct default planning models:
  - `wedding`: High vendor density, multi-ceremony timelines, complex seating and RSVP coordination.
  - `birthday`: Focused personal milestone with entertainment, catering, and age-appropriate themes.
  - `community`: Civic, neighborhood, or volunteer celebration with permits, task delegation, and multi-tier funding.
- **Budget Category:** A logical grouping of expenses (e.g. Venue, Catering, Decor, Photography, Entertainment, Logistics/Permits, Contingency) with an allocated planned amount.
- **Expense:** An individual monetary item within a Budget Category. Has an estimated cost, recorded actual cost, payment status (`projected`, `deposit_paid`, `settled`), and optional vendor link.
- **Deterministic Calculation Engine:** The pure TypeScript application logic responsible for all arithmetic sums, category variances, cost-per-guest metrics, and calendar date math. AI models are strictly prohibited from calculating authoritative numbers or dates.
- **Timeline Milestone:** A scheduled phase anchor calculated as a relative day offset (`offset_days`) from the Event Date (e.g. `-90` days).
- **Checklist Task:** An actionable to-do item assigned to a Timeline Milestone or Vendor category, carrying priority and completion status.
- **Vendor Record:** A tracked service provider entry containing contact details, quoted prices, booked status, notes, and deposit milestones. Event Pilot is a private tracking tool, not an external booking agency or payment processor.
- **Guest:** An individual attendee associated with an optional invitation group, RSVP response (`pending`, `confirmed`, `declined`), meal preference, and table assignment.
- **Seating Table:** A physical or logical table with a defined capacity limit and assigned guests.
- **Staged Proposal:** An AI-generated set of recommendations (budget allocations, milestones, checklists, ideas) held in a temporary staging state for explicit user review via a diff drawer before committing to persistent storage.
- **Diff Approval Flow:** The human-in-the-loop interaction where users compare proposed AI updates against current event state, allowing selective acceptance, inline editing, or dismissal.
