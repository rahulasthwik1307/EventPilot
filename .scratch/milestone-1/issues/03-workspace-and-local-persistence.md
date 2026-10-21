# 03: Workspace Shell, Sample Sandbox & Local Persistence Lifecycle

**Status:** done  
**Blocked by:** 02-ui-welcome-and-event-creation.md

## What to build
Build the personal and sample event workspace shell, including header metadata, countdown indicators, budget metrics, edit/delete actions, sample reset sandbox, and navigation tabs.

## Acceptance Criteria
- [x] Workspace header displaying event title, date countdown, guest count, and formatted budget cap.
- [x] Sample banner clearly identifying the sample sandbox with an independent "Reset Sample" button that never modifies personal events.
- [x] Edit Event dialog allowing users to update metadata and save changes immediately to `localStorage`.
- [x] Delete Event action with explicit confirmation warning that local browser data will be removed.
- [x] Status indicators for saving states ("Saved locally at [time]").
- [x] Stepped navigation tabs (`Overview`, `Budget Ledger`, `Timeline & Tasks`, `Vendors`, `Guests & Seating`, `AI Assistant`).
- [x] Overview tab rendering event summary card, financial breakdown, countdown, and honest status previews of future modules.
- [x] Responsive behavior across desktop, tablet, and mobile viewports.
- [x] Full automated test suite for UI flows and persistence verification.

## Comments
- Implemented `WorkspaceShell`, `WorkspaceHeader`, `SampleBanner`, `WorkspaceNavigation`, `OverviewTab`, `ModulePlaceholder`, and `EventEditDialog`.
- All 33 Vitest tests passing, production build succeeded, and ESLint checks clean.
