---
name: courtprime-forms
description: Task-oriented form and table patterns for CourtPrime — drawers, multi-step flows, selection tiles, booking UX, settings architecture, and data-table rules. Load before writing or editing any form, input group, create/edit screen, settings page, or table.
---

# CourtPrime Forms & Tables

## The failure mode being removed

```
<Card>
  label input label input label select label textarea [Save]
</Card>
```

That is a database record editor. Every form in CourtPrime is designed around
the **task**, not the table schema.

## Choosing the container

| Situation | Use |
|---|---|
| editing a record while context matters (a reservation on the scheduler) | **side drawer / inspector** — user never loses their place |
| creating something with real steps (booking, onboarding, demo application) | **multi-step flow** with progress |
| 1–3 fields | **inline edit** or popover, no page at all |
| destructive or irreversible | **dialog** with typed confirmation |
| mobile equivalent of any of the above | **bottom sheet** |
| genuinely long, genuinely standalone (org settings) | **full page with left settings nav** |

Full pages are the last resort, not the default.

## Rules for every form

- **Progressive disclosure.** One logical group visible at a time. Never 25 fields at once.
- **Selection tiles / segmented controls beat selects** when there are ≤6 visual options. A court, a duration, a payment method is a tile, not a dropdown.
- **Combobox with search** for anything with >20 options (player, product, branch).
- **Inline validation on blur**, not on submit. Error sits under the field, red + icon + text.
- **Sticky summary** on anything with a running total.
- **Sticky action bar** at the bottom of drawers and steps — never make the user scroll to find Save.
- Labels above inputs, always. Placeholder is never the label.
- Optional fields marked "optional"; do not mark required with a bare asterisk alone.
- Disabled submit is not feedback — explain what's missing.
- Explicit success state. Not just a toast that vanishes.

## Reservation booking — the flagship

Must feel like a booking app, not a record editor. Sequence:

**Player → Court → Date → Time → Duration → Players → Add-ons → Payment → Confirm**

- player: combobox search on CP Player ID / name, with avatar + rating in the result row
- court: visual court tiles showing surface, indoor/outdoor, rate, live status
- date: compact calendar, unavailable dates disabled with reason on hover
- time: **grid of clickable slot buttons**, not a time picker. States: available / reserved / past / selected
- duration: segmented control (30m / 1h / 90m / 2h)
- add-ons: paddle rental, balls, coaching — quantity steppers
- **sticky booking summary** rail on desktop, collapsible bottom sheet on mobile, live total
- confirmation: what / where / when / who / how much, plus one clear next action

Never show all steps at once on mobile.

## Settings architecture

Left nav → focused pane. Groups: Business Profile · Branches · Reservations ·
Pricing · Payments · Notifications · Tax · Integrations · Security.

Each pane is short and independently saveable. One enormous settings form is a defect.

# Tables

Tables are professional data surfaces. They do **not** live inside a floating card.

- Table sits directly on the page surface, bounded by `border-border`, `rounded-lg`
- `DataToolbar` above it: search, filters, saved views, column visibility, primary action
- Sticky header when the table scrolls
- Row density comfortable (`h-12`), compact mode optional
- Subtle hover (`hover:bg-surface-muted`), whole row clickable when there's a detail view
- Right-aligned numerics with `tabular-nums`
- Status as `<StatusBadge>`, inline
- Row actions in a trailing `⋯` menu, not five buttons per row
- Bulk selection **only** where a bulk action actually exists
- Always ship: loading skeleton, empty state (with a primary action), error state
- Sort indicator on the active column only

**Mobile:** convert to record cards only where the row is genuinely a record
(reservations, players, payments). Reference/config tables can keep 3 key columns
plus tap-through. Never force horizontal scroll on a simple dataset.
