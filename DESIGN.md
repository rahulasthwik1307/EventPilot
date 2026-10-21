---
name: Event Pilot
description: Inclusive, editorial event-planning studio inspired by the warmth and order of an almanac
colors:
  primary: "#D97706"
  primary-hover: "#B45309"
  primary-subtle: "#FEF3C7"
  secondary: "#C2410C"
  secondary-subtle: "#FFEDD5"
  neutral-bg: "#FDFBF7"
  neutral-surface: "#FFFFFF"
  neutral-subtle: "#F5EFEB"
  neutral-border: "#E7DFD5"
  neutral-border-strong: "#D6CCC2"
  neutral-text: "#1C1917"
  neutral-text-muted: "#78716C"
  success: "#15803D"
  success-subtle: "#DCFCE7"
  warning: "#B45309"
  warning-subtle: "#FEF3C7"
  danger: "#B91C1C"
  danger-subtle: "#FEE2E2"
typography:
  display:
    fontFamily: "Eczar, serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Eczar, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  badge-coupon:
    backgroundColor: "{colors.secondary-subtle}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-status:
    backgroundColor: "{colors.neutral-subtle}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  card-ledger:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Event Pilot — The Inclusive Celebration Almanac

## Overview

Event Pilot is a premium editorial event-planning studio inspired by the warmth, organization, and tactile character of a well-kept almanac. It transforms the complexity of planning weddings, birthdays, family gatherings, and community events into a clear, welcoming, and thoughtfully ordered experience.

The visual direction takes inspiration from the **Panchang & Utsav Almanac** concept: chronological structure, the character of printed reference books, warm paper surfaces, organized ledgers, and restrained celebratory color. These are visual inspirations, not assumptions about a user's religion, cultural identity, or event traditions.

Event Pilot must work equally well for celebrations with different cultural, religious, secular, and personal contexts. Panchang, Muhurtam, auspicious dates, and other tradition-specific information must be optional and context-aware. Never impose a religious tradition, ritual, calendar, or interpretation by default.

Rather than resembling a generic SaaS dashboard or a decorative bridal scrapbook, Event Pilot combines warm ivory surfaces, deep ink typography, marigold and terracotta accents, structured ledgers, purposeful whitespace, and subtle paper-inspired details.

### Key aesthetic anchors

- **Calm, high-clarity density:** Organize budgets, tasks, milestones, vendors, guests, and seating with clear hierarchy and enough whitespace to prevent information overload.
- **Warm editorial character:** Use ivory and papyrus-inspired surfaces, considered typography, delicate borders, and restrained color to create a welcoming planning environment.
- **Chronological clarity:** Make event dates, deadlines, task progress, and planning sequences easy to understand at a glance.
- **Honest visual status:** Status badges must reflect information the user has actually recorded. Visual styling must never imply external verification, vendor contact, payment, or booking that has not been confirmed by the user.
- **Human-controlled AI:** Present AI-generated recommendations as proposals that users can inspect, edit, selectively accept, or dismiss. Never silently overwrite an existing plan.
- **Inclusive by default:** Let the user's event type, preferences, and explicitly selected cultural context guide relevant content.

## Colors

The palette draws visual inspiration from turmeric, marigold, terracotta, cotton paper, and warm ink. These references establish a distinctive identity without requiring any particular cultural or religious interpretation.

### Primary palette

- **Marigold Amber — `#D97706`:** The primary brand and action color. Use for selected controls, active navigation accents, key interactive highlights, and important visual anchors. Pair with deep ink text when used as a filled background.
- **Burnished Ochre — `#B45309`:** The hover and emphasized-action color. White text may be used only after the foreground/background combination has been verified to meet the applicable contrast requirement.
- **Marigold Wash — `#FEF3C7`:** A soft highlight for selected rows, active sections, gentle emphasis, and relevant countdown or milestone surfaces.

### Secondary palette

- **Terracotta — `#C2410C`:** A supporting accent for selected controls, emphasized labels, and meaningful planning states. Do not use it as an automatic synonym for danger or as decoration without purpose.
- **Terracotta Wash — `#FFEDD5`:** A soft background for coupon-style labels, contextual notices, and selected proposal annotations. Ensure text and borders retain sufficient contrast.

### Neutral palette

- **Papyrus Canvas — `#FDFBF7`:** The main application background. Warm, restrained, and comfortable for extended planning sessions.
- **Card Surface — `#FFFFFF`:** The primary surface for ledger cards, forms, dialogs, and focused content.
- **Muted Sandstone — `#F5EFEB`:** Secondary panels, table headers, navigation backgrounds, and grouping surfaces.
- **Ceremonial Hairline — `#E7DFD5`:** Subtle structural borders and separators.
- **Strong Border — `#D6CCC2`:** A more visible border for important divisions and components that need clearer definition.
- **Deep Ink — `#1C1917`:** Primary text, headings, button text on marigold backgrounds, and important figures.
- **Stone Muted — `#78716C`:** Supporting labels, timestamps, descriptions, and secondary metadata. Verify contrast for the actual size and background before using it for text.

### Semantic status colors

- **Forest Green — `#15803D`, background `#DCFCE7`:** Recorded paid expenses, user-confirmed RSVPs, completed tasks, and explicitly accepted or committed proposals.
- **Amber Warning — `#B45309`, background `#FEF3C7`:** Pending responses, approaching deadlines, and tables at capacity.
- **Deep Crimson — `#B91C1C`, background `#FEE2E2`:** Over-budget categories, overdue critical tasks, and tables exceeding capacity.

Semantic colors communicate actual application states, not cultural meanings. Every important state must include a readable text label or another non-color indicator. Confirm text contrast for each foreground/background pairing.

### Named rule: The Functional Accent Rule

Marigold and terracotta should primarily emphasize interactive actions, selections, navigation states, and meaningful planning information. Avoid using these accents as arbitrary decoration. Neutral surfaces and typography should carry most of the interface.

## Typography

The typography system pairs the distinctive editorial character of **Eczar** for display headings with the clarity of **Plus Jakarta Sans** for application content and **JetBrains Mono** for aligned numerical information.

This is an English-first interface. Typography should feel expressive and considered without suggesting that bilingual content is available or required.

- **Display font:** Eczar, with a serif fallback.
- **Body and controls:** Plus Jakarta Sans, with system sans-serif fallbacks.
- **Numerical font:** JetBrains Mono, with a monospace fallback.

### Typographic character

The overall character is editorial, composed, approachable, and legible. Eczar provides personality to event titles and section headings. Plus Jakarta Sans keeps forms, instructions, tables, and operational details easy to scan. JetBrains Mono helps align numerical information where alignment improves readability.

### Hierarchy

- **Display:** Eczar, weight 600, `clamp(2rem, 5vw, 3.25rem)`, line-height 1.15. Use for the main event title, welcome heading, and a small number of prominent landmarks.
- **Headline:** Eczar, weight 600, `1.75rem`, line-height 1.25. Use for section titles such as Budget & Expenses, Timeline & Tasks, Vendors, and Guests & Seating.
- **Title:** Plus Jakarta Sans, weight 600, `1.125rem`, line-height 1.4. Use for card headings, category names, and dialog titles.
- **Body:** Plus Jakarta Sans, weight 400, `0.9375rem`, line-height 1.6. Use for descriptions, helper guidance, task details, vendor notes, and instructions.
- **Label:** Plus Jakarta Sans, weight 600, `0.75rem`, line-height 1.3, letter-spacing `0.05em`. Use sparingly for compact field labels, table headings, and short status labels. Do not make long or essential instructions small or uppercase.
- **Mono / tabular:** JetBrains Mono, weight 500, `0.875rem`, line-height 1.4. Use for monetary values, guest counts, dates, countdown values, and aligned numerical columns when it improves scanning.

### Named rule: The Tabular Truth Rule

Use tabular numerals (`font-variant-numeric: tabular-nums`) for financial figures, guest counts, and other columns where consistent digit alignment matters. Monospace typography is appropriate for key numerical displays, but it is not mandatory for every number in every sentence.

All calculated amounts, totals, percentages, and date differences must come from deterministic application logic rather than language-model arithmetic.

## Layout

Event Pilot uses an editorial planning workspace that supports both focused overview and detailed operational work. Navigation should make the main areas easy to find without competing with the information users are trying to manage.

### Desktop shell

- **Header:** Show the event name and a small set of relevant summary details. Countdown, attendance, and budget information may appear where useful, but must not crowd the header or repeat information already prominent in the current view.
- **Primary navigation:** Use a stepped, indexed-reference-inspired rail for Overview, Budget, Timeline & Tasks, Vendors, Guests & Seating, and AI Assistant.
- **Main canvas:** Give the active workspace the majority of available space. Keep tables, forms, summaries, and task lists readable and visually distinct.
- **Content width:** Use a maximum content width around 1440px where appropriate, with responsive side padding. Avoid forcing every screen to fill the maximum width.
- **Grid:** Use a flexible 12-column grid on wide layouts, with responsive gutters and column spans. The grid is a layout aid, not a requirement that every screen contain multiple columns.
- **Action placement:** Put important actions close to the content they affect. Use a persistent bottom action bar only when a workflow genuinely benefits from it, such as reviewing a staged proposal or completing a multi-step action. Do not display a permanent action bar on every screen by default.

### Responsive behavior

- **Wide desktop:** Use the navigation rail and flexible content grid. Keep the event summary compact and secondary to the active workspace.
- **Laptop and tablet:** Allow the navigation rail to collapse or become more compact. Reduce the number of simultaneous summary cards and columns as needed.
- **Mobile:** Use a compact header and accessible bottom navigation for the highest-priority destinations: Overview, Budget, Tasks, Vendors, and More. Place Guests & Seating and AI Assistant in an accessible secondary navigation surface.
- **Tables:** Convert dense tables into well-structured stacked rows or responsive layouts when necessary. Preserve labels, amounts, status, and relevant actions; do not hide important financial or guest information simply to fit the screen.
- **Dialogs and drawers:** Use full-width or near-full-width mobile layouts with safe-area-aware padding. Ensure content, buttons, and close controls remain reachable without horizontal scrolling.
- **Overflow:** Long event names, vendor names, large amounts, long guest lists, and narrow viewports must not break the layout.
- **Navigation state:** Clearly identify the current section with more than color alone.

### Spacing rhythm

Use the spacing scale consistently:

- `4px`: tiny icon gaps and tight internal spacing.
- `8px`: compact control groups and related labels.
- `16px`: standard component spacing.
- `24px`: card sections and medium layout gaps.
- `32px`: larger groups and section separation.
- `48px`: major page-level separation.

Use whitespace to create hierarchy, not to force unnecessary scrolling. Dense operational screens should remain efficient while retaining sufficient breathing room.

## Elevation & Depth

Prefer tonal layering, fine borders, and restrained shadows over heavy drop shadows.

- **Resting surfaces:** Sit against the Papyrus Canvas with subtle one-pixel borders.
- **Cards:** Use white surfaces and a restrained ambient shadow when separation is useful: `0 1px 3px rgba(28, 25, 23, 0.04), 0 4px 12px rgba(28, 25, 23, 0.03)`.
- **Drawers and dialogs:** Use a focused shadow such as `0 12px 32px -4px rgba(28, 25, 23, 0.12)`.
- **Backdrop:** A translucent sandstone-tinted backdrop may be used behind dialogs and drawers. Backdrop blur is optional progressive enhancement, not a prerequisite for clarity or usability.
- **Layering:** Ensure overlays remain distinguishable without relying on blur alone. Keep dialog text and controls fully opaque and readable.

### Named rule: The Paper Foundation Rule

Express depth through tonal shifts, fine borders, and subtle elevation. Avoid excessive shadows, glossy surfaces, and layers of decorative cards that make the interface feel generic or visually heavy.

## Shapes

### Corner radii

- **Small — `4px`:** Coupon-style labels, compact chips, and small tags.
- **Medium — `8px`:** Buttons, form fields, selection controls, and search inputs.
- **Large — `12px`:** Ledger cards, summary panels, and dialog containers.
- **Full — `9999px`:** Status pills, circular avatars, and progress tracks.

### Borders

Use `1px solid #E7DFD5` for standard boundaries and `#D6CCC2` when stronger separation is needed. Use accent borders for active selections and meaningful emphasis, not every card or section.

### Architectural motifs

Stepped edge tabs and indexed-reference details may evoke the structure of an almanac or organized paper planner. Use them sparingly to improve navigation and orientation. They must not reduce the clickable area, compromise accessibility, or become a purely decorative obstacle.

## Components

### Buttons

**Primary button**

- Background: `#D97706`.
- Text: Deep Ink `#1C1917`.
- Radius: `8px`.
- Padding: `10px 20px`.
- Font weight: 600.
- Hover background: `#B45309`; use white text only after confirming sufficient contrast.
- Focus: a clearly visible focus ring with sufficient contrast and offset.
- Interaction: provide visible hover, pressed, disabled, and loading states.
- Motion: subtle movement is acceptable, but the button must remain stable and easy to activate.

**Secondary button**

- Background: white.
- Text: Deep Ink `#1C1917`.
- Border: `1px solid #E7DFD5`.
- Radius: `8px`.
- Padding: `10px 20px`.
- Hover background: `#F5EFEB`.

**Destructive button**

- Use a restrained danger treatment with a clear text label describing the action.
- Do not make destructive actions visually dominant over the primary workflow unless the danger is immediate and significant.
- Require confirmation for consequential deletions, with a clear description of what will be removed.

### Badge & coupon stamp

Coupon-style badges provide the tactile character of a paper ledger or printed planning record. They are visual styling for recorded information, not independent proof of a real-world event.

- **Coupon badge:** `4px` radius, Terracotta border `#C2410C`, Terracotta Wash background `#FFEDD5`, and a compact, legible label.
- **Status pill:** Full radius, subtle tinted background, readable text, and an optional status icon or dot.
- **Allowed examples:** “BOOKING RECORDED”, “DEPOSIT PAID”, “RSVP CONFIRMED”, and “TASK COMPLETED” only when the corresponding state has actually been recorded.
- **Avoid:** “VERIFIED VENDOR”, “VENDOR APPROVED”, or “CONFIRMED BOOKING” unless the application has a reliable basis for that exact claim. Event Pilot is a vendor tracker, not a verification or booking marketplace.
- A deposit badge must reflect a payment status explicitly recorded by the user. It must not imply that Event Pilot processed or independently verified the payment.
- Use text labels as well as color so the state remains understandable to all users.

### Ledger cards & tables

- **Table headers:** Use a muted sandstone background, readable labels, and a clear bottom border.
- **Data rows:** Prefer clean white or ivory surfaces, fine separators, and restrained hover highlighting.
- **Amounts:** Right-align financial figures and use tabular numerals to support comparison.
- **Currency:** Display the currency selected for the event. INR is the default, not a universal requirement. Use appropriate localized formatting for the selected currency, and never mix different currencies in one total or silently convert between currencies.
- **Variance indicators:** Use clear labels such as “Under budget”, “Over budget”, and “On target”, with semantic colors as supporting cues.
- **Responsive behavior:** Preserve the relationship between each value and its label when tables become stacked rows on smaller screens.
- **Empty states:** Explain what the user can add next. Avoid decorative illustrations that delay access to the primary action.

### AI staged proposal drawer

The AI assistant must make proposed changes reviewable and reversible before they alter the user's existing plan.

- **Structure:** A right-side drawer of approximately `560px` on desktop, adapting to the available width and using a full-width or near-full-width layout on mobile.
- **Content:** Clearly distinguish the current plan from the proposed plan.
- **Diff presentation:** Identify additions, changes, and removals using text labels and structured comparisons. Green highlights may indicate additions, but meaning must never rely on color alone.
- **User authority:** Provide clear actions such as “Accept selected changes”, “Edit proposal”, and “Dismiss proposal”.
- **Selective acceptance:** Allow users to accept or reject individual proposed changes where the workflow supports it.
- **Validation:** Proposed changes must be validated against application schemas and business rules before acceptance.
- **Preservation:** Do not silently overwrite existing data. If generation or validation fails, preserve the current plan and explain the problem.
- **Privacy:** Do not send guest personal information or dietary details to Gemini by default.

## Motion & Interaction

Motion should clarify state changes and make the experience feel polished without slowing down planning tasks.

- **Standard easing:** `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Fast transitions:** Approximately `150ms` for hover states, checkbox changes, and small status transitions.
- **Standard transitions:** Approximately `250ms` for card expansion, drawers, and dialogs.
- Use motion to explain where a panel came from, what changed, or which selection is active.
- Avoid continuous decorative animation, excessive bounce, or effects that compete with financial and operational information.
- Respect `prefers-reduced-motion`. Provide reduced-motion alternatives and never make animation necessary to understand a state.
- All interactive elements must have clear focus, hover, pressed, disabled, and loading states as applicable.

## Accessibility & Usability

- Target WCAG 2.1 AA contrast requirements: at least `4.5:1` for normal text and `3:1` for large text and applicable graphical objects and user-interface boundaries.
- Verify the actual contrast of every text/background combination. Do not assume a palette token is accessible merely because it is part of the design system.
- Maintain visible keyboard focus and logical keyboard navigation.
- Ensure dialogs and drawers support keyboard interaction, sensible focus placement, and focus return when closed.
- Use semantic headings, buttons, labels, form controls, and status announcements.
- Associate validation errors and helper text with their relevant fields.
- Do not rely on color alone to convey selection, success, warnings, errors, or proposal differences.
- Keep touch targets comfortably usable, particularly in mobile navigation and dense tables.
- Ensure layouts work with zoom, narrow screens, long labels, and assistive technologies.
- Support reduced motion and avoid unnecessary animation.
- Use clear, plain English and explain unfamiliar planning terminology when needed.

## Do's and Don'ts

### Do

- **Do** use INR (`₹`) as the default currency and format it appropriately, for example `₹2,50,000`.
- **Do** respect each event's selected currency. Never silently mix currencies or imply an exchange-rate conversion that did not occur.
- **Do** use deterministic TypeScript logic for financial arithmetic, date calculations, countdowns, and capacity checks.
- **Do** use tabular numerals where aligned figures improve scanning.
- **Do** show clear loading and progress feedback while generating AI proposals.
- **Do** preserve the existing plan if AI generation, validation, or saving fails.
- **Do** make proposal changes reviewable before users accept them.
- **Do** use status badges only for states actually recorded by the user or established by a reliable application operation.
- **Do** confirm consequential deletions and explain what will be removed.
- **Do** keep navigation and action placement responsive to available screen space.
- **Do** test color contrast for actual component combinations and states.
- **Do** keep the interface culturally inclusive and make tradition-specific features opt-in and context-aware.
- **Do** minimize unnecessary exposure of guest personal information and dietary details.

### Don't

- **Don't** assume a religious tradition, ritual, calendar, or auspicious-date preference for every event.
- **Don't** imply that Event Pilot has verified, contacted, booked, or paid a vendor unless the exact state is supported by a recorded action or reliable evidence.
- **Don't** hard-code INR as the only possible event currency.
- **Don't** combine amounts in different currencies or silently convert them.
- **Don't** use white text on the Marigold Amber `#D97706` background without verified contrast; use Deep Ink text on this primary background.
- **Don't** rely on color alone to communicate a status or proposal change.
- **Don't** perform currency arithmetic, date arithmetic, or authoritative business-rule calculations inside LLM prompts.
- **Don't** allow AI recommendations to overwrite existing user plans without an explicit review and acceptance step.
- **Don't** crowd every screen with a fixed header, a navigation rail, multiple summary cards, and a permanent bottom action bar.
- **Don't** use cold generic SaaS styling, purple AI gradients, or decorative neon sparkles.
- **Don't** hide essential data to make a mobile layout appear simpler.
- **Don't** sacrifice keyboard accessibility, readability, or reduced-motion support for visual effects.

## Final design principle

Event Pilot should feel like a carefully crafted planning companion: warm without being ornamental, culturally aware without making assumptions, structured without feeling bureaucratic, and intelligent without taking control away from the user.

Every visual decision should help users understand their event, make confident planning decisions, and remain in control of their own information.
