# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web

## Stack

Next.js (App Router) + TypeScript + browser `localStorage` for local persistence + server-side Gemini API provider adapter + Zod schema validation + Vitest. Deployment target: Vercel.

## Users

- **Personal Celebration Hosts:** Couples planning weddings and individuals or families organizing birthdays. They need to coordinate budgets, guests, invitations, seating, venues, catering, vendors and event-day milestones.
- **Community Event Organizers:** Neighborhood coordinators, committee chairs and community volunteers planning festivals, fundraisers and public gatherings. They need to coordinate budgets, volunteers or tasks, vendors, permits, attendance and public timelines.

## Product Purpose

Event Pilot is an India-first, GenAI-powered event-planning assistant that transforms an event idea into a structured, editable and actionable plan.

It supports weddings, birthdays and community events through integrated budget management, timelines and tasks, vendor tracking, guest management, RSVP tracking, practical seating management and personalized planning recommendations.

The product helps users move from planning uncertainty to a costed, organized and controllable event workspace. AI accelerates planning, while deterministic application logic protects financial accuracy, date calculations and user data.

The initial interface is English-only. Cultural traditions, preferences and event requirements are user-controlled rather than assumed from an event type or location.

## Positioning

Event Pilot combines AI-assisted planning with deterministic calculations and explicit user approval.

Unlike conversational assistants that return unstructured suggestions, Event Pilot turns recommendations into structured proposals that users can inspect, edit, selectively accept or dismiss. Existing user decisions remain authoritative.

The product is a planning and management workspace, not a generic chatbot, vendor marketplace or autonomous event organizer.

The first release prioritizes a frictionless, local-first experience without mandatory registration, authentication or cloud-database setup.

## Operating Context

- **Primary workflow:** Users choose an event type, provide event details and constraints, generate an initial plan, review proposed recommendations, and manage the resulting workspace.
- **Event setup:** Capture event type, title, date, location, guest target, budget, currency, theme, preferences, cultural context and other relevant constraints.
- **Planning workspace:** Provide a coherent, responsive experience for budget management, timeline and tasks, vendor tracking, guest management, seating and AI-assisted planning.
- **Local-first workflow:** Let users create, edit, save and reopen events in the same browser without creating an account or connecting a database.
- **Design direction:** Premium editorial planning studio with warm ivory surfaces, deep ink typography, restrained terracotta and marigold accents, generous whitespace, polished micro-interactions and distinctive visual hierarchy. Avoid generic AI-generated styling and generic administrative-dashboard aesthetics.
- **Desktop:** Support efficient review of budgets, tasks, vendors, guest lists and planning changes.
- **Mobile:** Support responsive guest management, vendor check-ins, task updates and event-day reference.
- **Interaction principles:** Make important information easy to scan, make consequential changes understandable, and provide clear feedback for loading, saving, validation, errors and completed actions.

## Capabilities and Constraints

### Confirmed Capabilities

#### 1. Event Setup and Overview

- Support weddings, birthdays and community events with appropriate starter templates.
- Capture event details, date, location, expected attendance, budget, currency, theme and user-defined preferences.
- Provide an overview of budget status, upcoming milestones, tasks, guest attendance and vendor progress.
- Allow users to create, edit and manage events locally without registration.
- Preserve user-entered details when plans or event dates change.
- Provide a preloaded sample event so users can explore the product immediately.
- Keep sample data separate from personal events and clearly label the sample experience.

#### 2. Budget and Expense Management

- Generate AI-proposed budget allocations by relevant categories.
- Support planned budgets, estimates, actual expenses, payment status, vendor-related deposits and payment milestones.
- Show budget totals, remaining budget, category variance, overspending warnings and cost per guest.
- Use deterministic TypeScript logic for all monetary calculations. Never trust LLM-generated arithmetic as authoritative.
- Use INR as the default currency and allow a currency to be selected for each event.
- Never silently mix currencies or perform foreign-exchange conversion.
- Use a precision-safe monetary representation and explicit rounding rules.
- Distinguish estimated amounts from actual recorded expenses and user-entered financial figures.
- Recalculate estimated guest-dependent costs when confirmed attendance changes, without overwriting actual expenses or manually entered budget figures.
- Make recalculated estimates understandable to users.
- Handle missing, zero or changing guest counts without division errors or misleading metrics.

#### 3. Timeline and Task Management

- Generate event-specific milestones and suggested tasks using deterministic date calculations.
- Support creating, editing, completing and deleting tasks.
- Track task status, due dates, completion and overdue conditions.
- Recalculate date-dependent deadlines when the event date changes while preserving custom task details, completion status and user edits wherever possible.
- Correctly handle leap years, month boundaries, past dates and short-notice events.
- Flag overdue tasks, impossible dates and unrealistic preparation windows instead of silently moving or deleting user work.
- Allow users to adjust suggested deadlines manually.
- Keep date calculations in application logic rather than delegating calendar arithmetic to the AI model.

#### 4. Vendor Tracking

- Provide event-appropriate vendor categories and support custom vendor entries.
- Track vendor names, contact details, quotes, notes, booking status, deposits and payment milestones.
- Provide relevant checklists and questions to ask vendors.
- Allow users to record and update vendor progress.
- Never imply that a vendor was contacted, verified, selected or booked unless the user explicitly records that information.
- Do not include a vendor marketplace, local vendor discovery, automatic vendor contact or vendor payment processing in the initial release.

#### 5. Guest, Invitation and RSVP Management

- Support guest creation, editing, removal, search and organization.
- Require a guest name while keeping contact details optional.
- Support optional email or phone number, household or invitation groups, invitation status, RSVP response, meal preference, dietary restrictions or allergies, and optional planning notes.
- Support individuals, families, plus-ones and grouped invitations while tracking each attendee separately when needed.
- Track invited, confirmed, declined and pending responses accurately.
- Keep invitation tracking separate from invitation delivery. Users manage actual invitation delivery outside Event Pilot in the initial release.
- Use attendance counts consistently in event overviews and guest-dependent budget estimates.
- Keep guest information within the relevant local event workspace and avoid unnecessary exposure.
- Minimize collection, retention and transmission of personal information, particularly dietary and allergy details.

#### 6. Practical Seating Management

- Allow users to create and name tables and define table capacities.
- Assign guests to tables and move assignments between tables.
- Display unassigned guests and warn when table capacity is exceeded.
- Keep seating assignments consistent with guest records and RSVP information.
- Make assignment changes visible and understandable.
- Do not include a graphical floor-plan editor or drag-and-drop venue layout in the initial release.

#### 7. Gemini Planning Assistant

- Use the target model `gemini-3.8-flash`, subject to verification of its exact model identifier, availability, API access, SDK support, structured-output capabilities and quotas before integration.
- Do not silently substitute another model if the target is unavailable. Stop and obtain approval before changing the model decision.
- Generate the initial structured proposal through one Gemini request containing all four planning sections:
  1. Budget allocations and relevant estimates.
  2. Timeline milestones and tasks.
  3. Vendor checklist and recommendations.
  4. Personalized event ideas based on user-provided preferences and context.
- Support subsequent independent refinement of individual sections.
- Treat all generated recommendations as proposals rather than authoritative facts or committed changes.
- Allow users to inspect, edit, selectively accept or dismiss proposed changes.
- Present relevant differences between the existing plan and proposed changes.
- Preserve the existing plan while a replacement proposal is generated and reviewed.
- Never silently overwrite unrelated sections, manually entered data, completed tasks or existing financial records.
- Apply accepted changes consistently so related records cannot be left in a partially updated state.
- Validate AI output with Zod schemas and separate business-rule validation before applying changes.
- Bound request duration, response size and retry behavior.
- On timeout, API failure or invalid output, preserve the existing plan, explain the problem and offer a retry.
- Never automatically replace an existing plan with a fallback template after a failed request.
- Keep deterministic budget and date calculations outside the LLM.
- Keep the Gemini API key strictly on the server.
- Allow the core interface and sample demo to remain usable when the Gemini API key is not configured. Clearly explain when AI generation is unavailable.

#### 8. Demo, Local Work and Persistence

- Provide a welcoming entry experience with event-type choices and a preloaded sample event.
- Make the sample demo usable without authentication, Gemini API calls or database writes.
- Include sample recommendations and representative content for the core planning sections.
- Keep demo data isolated from personal events and clearly label the sample experience.
- Provide a resettable sample workspace that does not erase personal events.
- Allow users to create, edit and manage personal events locally.
- Persist personal event data in browser `localStorage`, including event details, guests, seating assignments, expenses, tasks, vendors and accepted planning changes.
- Restore locally saved events when the user reopens the application in the same browser and origin.
- Provide clear saving feedback and handle storage failures gracefully.
- Validate locally stored data when loading it. Handle missing, malformed or outdated data without crashing the application or silently overwriting recoverable user work.
- Provide an appropriate empty state when no personal event has been created.
- Explain that local data is specific to the browser and origin and is not automatically synchronized across devices.
- Explain that clearing browser storage, using a different browser or device, or losing access to the browser profile can make locally saved data unavailable.
- Do not require registration, login, anonymous authentication, a database or a cloud-persistence account in the initial release.
- Keep persistence behind a small, well-defined application interface so cloud persistence can be considered later without rewriting the planning domain.
- Do not introduce a backend database solely to store local event data.
- Keep the sample experience and personal event workspace separate.

### Explicitly Out of Scope for the Initial Release

- Supabase, PostgreSQL or any other application database for event persistence.
- User registration, login, anonymous authentication, account linking or account recovery.
- Cloud synchronization, cross-device persistence and multi-user collaboration.
- Vendor marketplace and local vendor discovery.
- Sending invitations through email, SMS or messaging integrations.
- Payment processing.
- Graphical drag-and-drop seating charts.
- Automatic foreign-exchange conversion.
- Autonomous vendor booking, contacting or verification.
- Automatic acceptance of AI-generated changes.
- Sending guest contact details, dietary restrictions or allergy records to an AI provider by default.

## Technical and Security Constraints

- Keep Gemini API credentials and other secrets strictly server-side. Never expose them through client code, public environment variables, logs or committed files.
- Do not introduce authentication or database infrastructure for the initial release.
- Treat browser storage as local persistence, not as a secure vault or a cloud backup.
- Do not store API keys, secrets, authentication tokens or other server credentials in `localStorage`.
- Avoid storing unnecessary sensitive guest information. Clearly communicate that local event data remains in the user's browser storage and may be accessible to other people who can access the same browser profile.
- Avoid sending identifiable guest details, contact information or dietary and allergy records to Gemini by default. Prefer aggregate or de-identified context wherever possible.
- Prevent sensitive guest details from leaking into logs, analytics and error messages.
- Keep sample/demo data isolated from personal events.
- Validate user input and AI-generated data at the appropriate schema and business-rule boundaries.
- Validate persisted local data before using it in application logic.
- Handle unavailable storage, quota errors, malformed saved data and persistence failures gracefully.
- Avoid destructive automatic migrations. Preserve recoverable user data when the local data format changes.
- Use safe, consistent updates for accepted proposals and related records.
- Use precision-safe monetary arithmetic and deterministic calendar calculations.
- Keep `.env*` files containing secrets out of version control, with an appropriately sanitized `.env.example`.
- Do not claim that a feature is secure, tested or production-ready without the corresponding verification.
- Keep the application modular so a future persistence adapter could be introduced if an actual product or evaluation requirement justifies it.

## Brand Commitments

- **Name:** Event Pilot
- **Voice and tone:** Calm, competent, reassuring, organized and celebratory without frivolous distraction.
- **Visual identity:** Premium editorial planning studio, warm ivory surfaces, deep ink typography, restrained terracotta and marigold accents, generous whitespace, elegant typography and polished micro-interactions.
- **Experience quality:** Handcrafted, intentional and cohesive rather than a generic AI dashboard or template.
- **Interaction quality:** Clear states, purposeful feedback, accessible controls and understandable consequences for consequential actions.
- **Cultural inclusion:** India-first context with user-controlled cultural preferences and no assumptions that every event follows the same traditions.
- **Trust:** Never present generated ideas, estimates, vendor information or schedules as verified facts without evidence.

## Evidence on Hand

- Prompt Wars Challenge 5 problem statement: Celebration & Event Planner.
- Evaluator parameters: Code Quality (High), Security (Medium), Efficiency (Medium), Testing (Low), Accessibility (Low) and Problem Statement Alignment (Very High).
- Existing repository: EventPilot, with the Matt Pocock skills and Impeccable installed.
- Product decisions confirmed through the Event Pilot specification review.
- Initial release decision: local-first event planning with browser persistence, without authentication or a database.
- Gemini target model availability and API compatibility remain to be verified before integration.
- The initial repository foundation has been created and verified with TypeScript, tests and a production build, according to the project setup report.
- No dedicated Event Pilot database or authentication project is required for the initial release.

## Product Principles

1. **Deterministic Math Over Probabilistic Guessing:** AI proposes distributions, tasks and creative ideas; application logic calculates monetary totals, variances, attendance-dependent estimates and calendar dates.
2. **Human-in-the-Loop Authority:** AI recommendations remain staged proposals until the user reviews and approves them. Users can selectively accept, edit or dismiss changes.
3. **Preserve Existing Work:** Refinement and failure handling must not silently overwrite existing data. Accepted related changes must be applied consistently.
4. **Actionable Slices Over Generic Text:** AI output should become structured, editable planning entities rather than unstructured prose.
5. **Resilient Validation:** Validate AI outputs and business rules before applying changes. On failure, preserve the existing plan, explain the error and allow retry.
6. **Privacy by Default:** Collect only necessary information, protect locally stored data from unnecessary exposure and minimize transmission of guest data.
7. **Transparent Calculations:** Explain budget and attendance-dependent estimate changes and distinguish estimates from actual expenses.
8. **Demo Without Friction:** The sample experience must work without authentication, AI API calls or database writes.
9. **Local-First Simplicity:** Personal events should work without account creation or cloud infrastructure. Communicate the limitations of browser-local persistence clearly.
10. **Focused Scope:** Prefer reliable, complete core planning workflows over speculative integrations and unnecessary architectural complexity.

## Accessibility and Inclusion

- Target WCAG 2.1 AA across all views.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for applicable large text, controls and interactive boundaries.
- Support keyboard navigation, visible focus, accessible dialogs and appropriate focus management.
- Provide accessible labels and feedback for guest lists, seating assignments, budget controls, tasks and AI proposal review.
- Announce relevant asynchronous AI-generation, saving, validation and recalculation status changes to assistive technologies.
- Respect reduced-motion preferences and avoid using color alone to communicate status.
- Ensure responsive layouts remain usable on mobile devices and desktop screens.
- Treat dietary restrictions and allergy information with care and avoid exposing such information unnecessarily.
- Make local saving and storage failures understandable to users without relying on color alone.
