# 05: Vendor Management UI & Modal Dialogs

**Status:** closed  
**Blocked by:** 01, 04

## What to build
Build the complete Vendors tab and management dialogs in `src/components/vendors/`.

## Acceptance Criteria
- [x] `VendorsTab.tsx`:
  - Financial metric cards: Total Quoted, Agreed Commitments, Total Paid, Remaining Balance, and Status counts.
  - Category and Status filter controls.
  - Search input filtering vendor records by name, contact, notes.
  - Vendor card roster displaying category badge, status pill, contact details, financial breakdown, and notes.
  - Explicit "Unlink Category" if linked category is deleted.
- [x] `VendorDialog.tsx`:
  - Name, category, status, quoted cost, agreed cost, deposit paid, contact person, phone, email, website, notes, and optional budget category linkage.
  - Form validation with inline error messages.
  - Clear helper text explaining that deposits and commitments do NOT alter budget expense records.
- [x] `VendorDeleteDialog.tsx`:
  - Accessible confirmation modal.
- [x] Responsive layout and WCAG 2.1 AA keyboard/screen reader compliance.
- [x] Component tests in `src/components/vendors/__tests__/VendorsTab.test.tsx`.

## Verification
- Verified with 3 tests in `src/components/vendors/__tests__/VendorsTab.test.tsx`.
- Validated add vendor flow, editing, and metric calculation.
