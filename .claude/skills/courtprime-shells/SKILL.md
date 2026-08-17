---
name: courtprime-shells
description: The five CourtPrime persona shells and their navigation architecture, plus responsive/mobile IA rules. Load before editing layouts, app-sidebar, nav-main, lib/navigation.ts, any *-layout.tsx, or when adding a page that needs a shell.
---

# CourtPrime Shells & Navigation

## The rule that is currently broken

> Do not use one generic sidebar and hide menu items.

`lib/navigation.ts` today gives superadmin **23 items in one flat group** and the
owner 3 groups of 10–13. That is the exact failure mode. Each persona gets its
own information architecture, sharing one design language.

## Five shells

| Shell | Persona | Structure |
|---|---|---|
| `MarketingShell` | public | transparent nav → solid on scroll, dark footer |
| `PlayerShell` | player | **mobile-first sports app.** Bottom tab bar, no sidebar. Desktop = centered column + compact top nav |
| `OwnerShell` | organization_owner, branch_manager | executive workspace. Icon rail + collapsible groups, context bar for org/branch/date |
| `OperationsShell` | front_desk, scorekeeper, tournament_director | operational. Wide content, large touch targets, minimal chrome, live status strip pinned |
| `CashierShell` | cashier | POS workstation. **No sidebar at all.** 65/35 split, shift bar on top |
| `SuperadminShell` | eaj_superadmin | network control center. Denser, platform-scoped nav, global search first |

## Navigation limits

- **Max 7 items visible** in any one group without scrolling
- **Max 3 groups** expanded at once; others collapsed by default
- Group by user intent, not by database table
- Everything else lives in **⌘K / Ctrl+K** command menu — this is required, not optional
- The command menu is the pressure valve. If you are tempted to add an 8th nav item, it belongs in ⌘K.

Owner groups (target): `Today` · `Courts & Bookings` · `People` · `Money` · `Growth`.
Settings is a destination with its own left nav, **not** nav items.

## Player shell — sports app, not admin

Bottom nav, exactly five: **Home · Discover · Play · Live · Profile**.

- `h-16` + safe-area inset bottom
- 44px minimum touch targets
- active state = pink icon + label, never color alone
- **never** render the desktop sidebar on a player route
- primary actions in the bottom third of the screen (thumb reach)

`/me` priority order: identity → what's next → where to play → how am I doing.

## Cashier shell

No nav sidebar. Escape hatch is a single "Exit POS" control. Product workspace
65% / cart rail 35% on desktop; on tablet the cart becomes a bottom sheet.
Checkout button is the largest control on the screen. No analytics anywhere.

## Responsive

Must work at **1440 · 1280 · 1024 · 768 · 430 · 390 · 360**.

Do not shrink the desktop layout. Re-architect:

| Desktop | Mobile |
|---|---|
| sidebar | bottom nav (player) or top sheet menu (staff/owner) |
| side inspector / drawer | bottom sheet |
| wide table | record cards, or 3 key columns + tap for detail |
| KPI band | 2-up scroll rail |
| decorative artwork | reduced or removed |
| hover affordance | always-visible affordance |

Never force horizontal scroll for a simple dataset.
Sticky page header on mobile costs vertical space — only keep it if it holds a
primary action.

## Every shell provides

`PageHeader` (title, description, breadcrumb, primary action) · `ContextBar`
(org / branch / date / status) · `CommandMenu` (⌘K) · toast region ·
skip-to-content link · a visible focus ring on every interactive element.

## Accessibility floor

WCAG AA contrast. Visible keyboard focus (`focus-visible:ring-2 ring-ring
ring-offset-2`). Real `<button>`/`<a>`, never a clickable `<div>`. Labels tied to
inputs. Status never by color alone. Touch targets ≥44px. Reduced motion respected.
