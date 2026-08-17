---
name: courtprime-design-system
description: CourtPrime design tokens, spacing, typography, radius, shadow and the anti-card-soup rule. Load BEFORE editing any .tsx under resources/js or any CSS. Use whenever writing or reviewing UI markup, choosing a color, adding a Card, or setting spacing.
---

# CourtPrime Design System

Visual thesis: **premium sports technology with enterprise SaaS discipline.**

## Rule 0 — no raw hex, ever

The codebase is full of `#07132F`, `#E61B5B`, `#FF1F64`, `bg-white`, `text-slate-500`.
All of it is legacy. Replace on sight.

```
BANNED                      USE
#07132F / #050C20           bg-surface-deep / bg-background
#E61B5B / #FF1F64           bg-primary / text-primary
bg-white                    bg-surface
text-slate-500              text-muted
border-white/10             border-border
text-[#07132F]              text-foreground
```

If a color is not in the token table below, it does not go in a class.

## Token reference

Defined in `resources/css/app.css` under `:root` / `.dark`. Use the Tailwind
utility, never the raw var.

**Surfaces** — four levels, that is all.

| Token | Utility | Use for |
|---|---|---|
| `background` | `bg-background` | page ground |
| `surface` | `bg-surface` | the default raised plane (tables, panels, sheets) |
| `surface-raised` | `bg-surface-raised` | things genuinely floating (popover, dropdown, drawer) |
| `surface-muted` | `bg-surface-muted` | recessed wells, table header, disabled |
| `surface-deep` | `bg-surface-deep` | navy immersive sections, marketing dark bands, app rail |

**Text** — `text-foreground`, `text-secondary`, `text-muted`. Three levels.
Never a fourth. Never `text-slate-*`.

**Border** — `border-border` default, `border-border-strong` for emphasis
(table outer edge, focused field, selected tile).

**Brand**

| Token | Utility | Reserved for |
|---|---|---|
| `primary` (hot pink) | `bg-primary` `text-primary` | THE primary action on a screen, live status, selected state, brand moment |
| `secondary` (electric blue) | `bg-secondary` `text-secondary-fg` | secondary emphasis, network connections, info state, data-viz series 2 |

There is **one** `bg-primary` button per screen region. If you are writing a
second one, the first was not primary.

**Status** — always paired with a label or icon, never color alone (a11y).

`success` `warning` `danger` `info` `live` `available` `reserved` `maintenance` `open-play`

Use `<StatusBadge status="..." />`. Do not hand-roll a colored dot.

## Scales

**Spacing** — 4px base. Use only: `1 2 3 4 6 8 10 12 16 20 24 32`.
Never `p-[13px]`, never `mt-[22px]`.

- inside a control: `2`–`3`
- inside a panel: `4`–`6`
- between related blocks: `6`–`8`
- between page sections: `12`–`16`
- marketing section band: `24`–`32`

**Container** — `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`. Use the `<Container>`
component. Do not re-type this string.

**Radius** — `rounded-md` controls, `rounded-lg` panels, `rounded-2xl` marketing
surfaces, `rounded-full` pills/avatars. Nothing else. Never mix three radii in
one component.

**Shadow** — `shadow-e1` hover lift, `shadow-e2` dropdown/popover,
`shadow-e3` drawer/modal. Nothing on a static panel — use a border instead.
`shadow-2xl` is banned.

**Z-index** — `z-nav` 30, `z-sticky` 40, `z-drawer` 50, `z-modal` 60, `z-toast` 70.

## Typography

| Role | Class |
|---|---|
| display (marketing hero) | `text-display` — 3rem→4.5rem, tight, `font-semibold` |
| page heading | `text-h1` — 1.75rem, `font-semibold`, `tracking-tight` |
| section heading | `text-h2` — 1.25rem, `font-semibold` |
| panel heading | `text-h3` — 1rem, `font-semibold` |
| body | `text-body` — 0.9375rem |
| secondary body | `text-body text-secondary` |
| label | `text-label` — 0.8125rem, `font-medium` |
| metadata | `text-meta` — 0.75rem, `text-muted` |
| numeric KPI | `text-kpi` — `tabular-nums`, `font-semibold`, `tracking-tight` |

Every number that can change (money, scores, counts, times) gets
`tabular-nums`. Non-negotiable — it stops layout jitter.

## Rule 1 — kill card soup

> If removing the outer card does not reduce comprehension, remove the card.

A `<Card>` is legitimate only when the thing is **individually actionable or
individually navigable** — a court tile you click, a plan you select, a venue
listing you open.

A card is **wrong** for: a page section, a chart, a table, a KPI, a form, a
heading with text under it, a list.

Reach for these instead:

- `<Section>` — heading + description + content, no chrome
- `<MetricBand>` — one horizontal band of KPIs separated by dividers, not N cards
- `<DataToolbar>` + bare table on the page surface
- a `<Separator>` or just whitespace
- a left/right split with a sticky panel
- a drawer or side inspector

**Before you commit any page, count the rounded rectangles.** More than 3 visible
groups of identical bordered boxes means redesign, not adjust.

## Rule 2 — hierarchy before boxes

Establish hierarchy with type scale, weight, and space. Only add a border or
surface when two things genuinely need separating. A page that reads correctly
with zero borders is a good page.

## Effects budget

Per viewport, at most **one** of: a gradient, a glass surface, a glow.
`backdrop-blur` on the nav bar only. `blur()` radius never above 40px.
No neon. No esports.

## Checklist before finishing any UI file

- [ ] zero raw hex / `slate-*` / `bg-white`
- [ ] one `bg-primary` action in the region
- [ ] spacing values from the scale
- [ ] one radius family
- [ ] no shadow on static panels
- [ ] numbers are `tabular-nums`
- [ ] status has a text label, not just color
- [ ] I counted the boxes and it is not card soup
