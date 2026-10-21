# Milestone 3 Specification: Vendor Management, Guest & RSVP Management, and Seating Planner

**Milestone:** 3  
**Status:** In-Progress (Specification & Architecture Phase)  
**Parent Workspace:** Event Pilot (Challenge 5: Celebration & Event Planner)  
**Baseline Verified:** Milestone 1 (Core & Storage) & Milestone 2 (Budget & Timeline Engine) — 71 tests passing, clean typecheck, 0 lint warnings.

---

## 1. Domain Modeling & Architecture

### 1.1 Vendor Management Domain (`src/features/vendors/`)
- **Entities:**
  - `Vendor`:
    - `id`: string (UUID or stable prefixed ID `vnd_...`)
    - `name`: string (1-100 chars)
    - `category`: `VendorCategory` (`venue`, `catering`, `photography`, `decoration`, `entertainment`, `music_dj`, `clothing_makeup`, `transport`, `accommodation`, `invitations_printing`, `equipment_rentals`, `other`)
    - `contactPerson`?: string
    - `phone`?: string
    - `email`?: string
    - `website`?: string
    - `status`: `VendorStatus` (`researching`, `contacted`, `quote_received`, `negotiating`, `booked`, `cancelled`)
    - `quotedCost`: number (>= 0)
    - `agreedCost`?: number (>= 0, optional until contract/agreement reached)
    - `depositPaid`: number (>= 0, default 0)
    - `amountPaid`: number (>= 0, canonical total paid to date including deposit)
    - `remainingBalance`: number (derived: `agreedCost != null ? Math.max(0, agreedCost - amountPaid) : 0`, with explicit state indicating whether agreed cost is established)
    - `linkedCategoryId`?: string (link to `BudgetCategory.id` in `event.categories`)
    - `notes`?: string
    - `createdAt`: string (ISO)
    - `updatedAt`: string (ISO)
- **Accounting & Separation Rules (Strict Guardrails):**
  - Vendor agreed costs and payments **never create or overwrite Milestone 2 `Expense` records**.
  - Linking a budget category to a vendor does **not** alter `totalActual` or `allocatedAmount` in the Budget Ledger.
  - Deposits and payments are tracked in the vendor record for private contract management.
  - If a linked `BudgetCategory` is deleted in the Budget Ledger, the vendor's `linkedCategoryId` is safely set to `undefined` (or marked orphaned) without throwing or deleting the vendor.
  - Pure calculation engine `calculateVendorFinancials`:
    - `totalQuoted`: sum of all active vendor quotes.
    - `totalAgreed`: sum of vendors where `agreedCost` is specified (excluding `cancelled`).
    - `totalPaid`: sum of `amountPaid` across all active vendors.
    - `totalRemaining`: sum of remaining balances for vendors with `agreedCost`.
    - `bookedCount`, `negotiatingCount`, `cancelledCount`.

### 1.2 Guest & RSVP Management Domain (`src/features/guests/`)
- **Entities:**
  - `GuestHousehold`:
    - `id`: string (stable prefixed ID `hh_...`)
    - `name`: string (e.g. "The Sharma Family", "College Friends")
    - `relationshipType`?: string (e.g. "Bride Family", "Groom Family", "Work Colleagues", "Neighbors")
    - `notes`?: string
  - `Guest`:
    - `id`: string (stable prefixed ID `gst_...`)
    - `firstName`: string
    - `lastName`?: string
    - `householdId`?: string (optional link to `GuestHousehold.id`)
    - `relationship`?: string
    - `phone`?: string
    - `email`?: string
    - `rsvpStatus`: `RsvpStatus` (`pending` | `confirmed` | `declined`)
    - `invitationStatus`: `InvitationStatus` (`not_sent` | `sent` | `delivered`)
    - `plusOneAllowed`: boolean
    - `plusOneExpected`: boolean
    - `plusOneName`?: string
    - `dietaryPreference`?: `DietaryPreference` (`none` | `vegetarian` | `vegan` | `jain` | `halal` | `gluten_free` | `other`)
    - `dietaryNotes`?: string
    - `notes`?: string
    - `createdAt`: string (ISO)
    - `updatedAt`: string (ISO)
- **Attendance Calculation Rules:**
  - `totalNamedGuests`: total guest records.
  - `pendingCount`: guests with `rsvpStatus === 'pending'`.
  - `confirmedCount`: guests with `rsvpStatus === 'confirmed'`.
  - `declinedCount`: guests with `rsvpStatus === 'declined'`.
  - `expectedPlusOnes`: count of guests where `rsvpStatus === 'confirmed'` AND `plusOneExpected === true`. (Declined/pending guests' plus-ones are NOT expected).
  - `expectedAttendance`: `confirmedCount + expectedPlusOnes`.
  - `ungroupedCount`: guests with no `householdId`.
  - Safe group deletion: Deleting a household unlinks member guests (`householdId = undefined`) rather than destroying guest records.
  - Plus-one promotion: When a plus-one is converted to an explicit named guest, `plusOneExpected` is set to `false` on the primary guest to prevent double-counting.

### 1.3 Seating & Table Planner Domain (`src/features/seating/`)
- **Entities:**
  - `SeatingTable`:
    - `id`: string (stable prefixed ID `tbl_...`)
    - `name`: string (e.g. "Table 1 - Mandap View", "Family Dining Table")
    - `capacity`: number (integer >= 1, sensible max 50)
    - `tableType`?: 'round' | 'rectangular' | 'high_top' | 'head_table'
    - `notes`?: string
  - `SeatingAssignment`:
    - `id`: string (stable prefixed ID `asg_...`)
    - `tableId`: string
    - `guestId`: string
    - `isPlusOne`: boolean (if true, represents the confirmed plus-one seat for `guestId`)
    - `assignedAt`: string (ISO)
- **Occupancy & Seating Calculation Rules:**
  - One seat per occupant: Each attendee (named guest or plus-one seat) can have at most one active table assignment.
  - Expected vs. Provisional:
    - Confirmed guests and confirmed plus-ones occupy expected seats.
    - Pending guests may be provisionally assigned, marked with a prominent `Pending RSVP` badge, but counted transparently.
    - Declined guests do NOT count toward expected occupancy; if assigned, flagged as `Declined Guest Occupying Seat`.
  - Table Metrics:
    - `currentOccupancy`: count of active assignments on the table.
    - `expectedOccupancy`: count of confirmed assigned attendees + confirmed assigned plus-ones.
    - `isOverCapacity`: `currentOccupancy > capacity`.
    - `isFull`: `currentOccupancy === capacity`.
    - `availableSeats`: `Math.max(0, capacity - currentOccupancy)`.
  - Overall Seating Metrics:
    - `totalTables`: count of tables.
    - `totalSeats`: sum of table capacities.
    - `expectedAssigned`: count of confirmed attendees assigned to a table.
    - `unassignedExpected`: `expectedAttendance - expectedAssigned`.
    - `overCapacityCount`: number of tables where `currentOccupancy > capacity`.
    - `seatingProgressPct`: `expectedAttendance > 0 ? Math.round((expectedAssigned / expectedAttendance) * 100) : 0`.
  - Safety & Degradation:
    - Table deletion safely unassigns all occupants.
    - Capacity reduction below occupancy preserves assignments and shows an immediate visual alert and warning banner.

---

## 2. Persistence, Migrations & Privacy

### 2.1 Backward-Compatible Storage Pipeline
- Existing M1 and M2 records in `localStorage` under `STORAGE_KEYS.PERSONAL_EVENTS` and `STORAGE_KEYS.SAMPLE_EVENT` must upgrade automatically without data loss.
- `migrateEventToM3(event)`:
  - Preserves existing `categories`, `expenses`, `milestones`, `tasks`, `culturalContext`.
  - Initializes `vendors: event.vendors || []`.
  - Initializes `households: event.households || []`.
  - Initializes `guests: event.guests || []`.
  - Initializes `tables: event.tables || []`.
  - Initializes `assignments: event.assignments || []`.
  - Validates and sanitizes orphaned foreign keys (e.g. assignments referencing non-existent tables or guests).
- Sample Event (`createFreshSampleEvent`):
  - Enriched with 6 Vivaha vendors (Venue, Catering, Photography, Decor, Music, Makeup) with realistic costs and deposit records.
  - 4 households ("Sharma Family", "Verma Family", "College Friends", "Neighborhood Circle").
  - 14 guests across various RSVP states, plus-ones, and dietary restrictions (Jain, Vegetarian, Halal).
  - 4 tables ("Table 1 - Mandap Royal", "Table 2 - Elders & Family", "Table 3 - Youth & Friends", "Table 4 - Community Banquet") with assignments, a full table, and unassigned attendees to demonstrate planner interactions.

### 2.2 Data Privacy & Security
- 100% local persistence in browser `localStorage`.
- Zero external transmissions (no network requests, no AI API calls, no third-party analytics).
- User notes and dietary descriptions rendered strictly as safe text nodes in React, preventing XSS.

---

## 3. Impeccable Design & UI Surface Integration

### 3.1 Design System Alignment (`DESIGN.md`)
- **Palette:** Panchang & Utsav Almanac palette (`#D97706` marigold, `#C2410C` terracotta, `#FDFBF7` ivory ground, `#F5EFEB` warm subtle surface, `#1C1917` deep ink text, `#E7DFD5` borders).
- **Typography:** Eczar for section headings, Plus Jakarta Sans for body/controls, JetBrains Mono for monetary and count metrics.
- **Contrast & Accessibility:** Full WCAG 2.1 AA compliance with high-contrast text (`#1C1917` on `#D97706`), accessible form labels, keyboard navigation, dialog traps, and status badges that never rely on color alone.

### 3.2 Workspace Navigation Tabs
The main workspace navigation (`WorkspaceNavigation.tsx`) will feature 6 distinct tabs:
1. `Overview` (Updated with M3 live summary cards for Vendors, RSVPs, and Seating)
2. `Budget Ledger` (Unchanged M2 functionality)
3. `Timeline & Tasks` (Unchanged M2 functionality)
4. `Vendors` (Live M3 Vendor Book & Commitments)
5. `Guests & RSVP` (Live M3 Guest Register & Household Roster)
6. `Seating Planner` (Live M3 Table Capacity & Seat Allocation Matrix)
7. `AI Assistant` (Staged Proposal Drawer placeholder for M4)

---

## 4. Test Strategy
1. **Vendor Engine Unit Tests:**
   - Quoted vs. agreed cost calculations, deposit validation, canonical amount paid, remaining balance logic.
   - Independence of vendor commitments from budget actual expenses.
   - Category deletion handling and orphan recovery.
2. **Guest & RSVP Unit Tests:**
   - Household creation, guest association, and safe group deletion.
   - RSVP status transitions and deterministic attendance summary math.
   - Plus-one expected counting and conversion into named guests without double-counting.
3. **Seating Engine Unit Tests:**
   - Table capacity validation (positive integers only).
   - Single-seat assignment constraint (no duplicate assignments for same guest or plus-one).
   - Occupancy calculations: confirmed vs. pending vs. declined.
   - Over-capacity warnings and dynamic capacity reduction behavior.
   - Unassigned expected attendee identification.
4. **Storage & Migration Tests:**
   - Upgrading M1 and M2 snapshots to M3.
   - Idempotency of repeated migrations.
   - Ensuring no personal event data is fabricated or overwritten.
5. **Component Integration Tests:**
   - `VendorsTab`: add vendor, filter by category/status, inspect financials.
   - `GuestsTab`: add guest, update RSVP, assign household, toggle plus-one.
   - `SeatingTab`: create table, assign guest, verify occupancy and over-capacity alert.
   - `WorkspaceShell` & `OverviewTab`: tab switching and live summary metrics.
