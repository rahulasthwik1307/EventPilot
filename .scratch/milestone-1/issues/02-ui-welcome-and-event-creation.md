# 02: Welcome Experience, Event Type Selector & Event Creation Flow

**Status:** done  
**Blocked by:** 01-event-domain-and-storage.md

## What to build
Build the welcome studio entry experience and the accessible event creation modal flow in strict adherence to the Panchang & Utsav Almanac design system.

## Acceptance Criteria
- [x] Welcome header and hero communicating Event Pilot's mission with editorial typography (Eczar display headings).
- [x] Three event-type showcase cards (`wedding`, `birthday`, `community`) with distinct descriptions and quick start actions.
- [x] Direct "Explore Sample Event" entry without setup, accounts, or friction.
- [x] Accessible `EventCreateDialog` collecting event type, title, date, location, guest target, budget cap, currency (default INR), and opt-in cultural preferences.
- [x] Plain-language validation error presentation with `aria-describedby` and visible feedback without clearing user input.
- [x] Saved personal events list on the welcome page if local events exist.
- [x] Local storage disclaimer explaining that data is stored in the browser profile.
- [x] WCAG 2.1 AA contrast verified (Deep Ink `#1C1917` on Marigold `#D97706`).

## Comments
- Implemented `WelcomeHero`, `EventTypeCards`, `SavedEventsList`, `EventCreateDialog`, `Dialog`, and `Badge`.
- Verified WCAG 2.1 AA compliant contrast (`#1C1917` on `#D97706` primary button).
- Implemented accessible field-level error messages connected via `aria-describedby` and `aria-invalid`.
