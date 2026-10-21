# 05: Local Storage Migration, Sample Updates & Workspace Integration

**Status:** closed  
**Blocked by:** 03-budget-ledger-ui.md, 04-timeline-and-tasks-ui.md

## What to build
Integrate Budget and Timeline tabs into `WorkspaceShell`, update `OverviewTab` to display live calculations, implement `migrateEventToM2` for seamless backward compatibility with M1 data, and enrich the sample celebration.

## Acceptance Criteria
- [x] `migrateEventToM2` seamlessly upgrades existing Milestone 1 events without data loss or fabricated expenses.
- [x] Preloaded sample celebration updated with realistic categories, expenses, milestones, and tasks.
- [x] `WorkspaceNavigation` tabs updated (Budget Ledger and Timeline & Tasks now live).
- [x] `OverviewTab` displays live counts, budget calculations, and upcoming tasks.
- [x] Event editing dialog triggers re-anchoring when the celebration date is changed.
- [x] Automated tests for schema migration, backward compatibility, and UI integration.
