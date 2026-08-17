---
name: player-mobile-ux
description: Phone-first rules for every CourtPrime surface a player can reach (/me, /me/book, /me/profile, /me/wallet, discovery pages, leaderboards, live display, auth). Load before editing any player-facing page, the PlayerShell, or the bottom tab bar. Players are on phones; the desktop layout is the afterthought here, not the other way round.
---

# Player Mobile UX

**Players are on phones.** Staff are at a desk, owners are on a laptop, players are
standing courtside on a 390px screen with one thumb. Every player surface is
designed at 360px first and allowed to grow.

## The five reference widths

Check every player screen at **360 · 390 · 430 · 768 · 1280**. 360 is the floor
(older Androids, iPhone SE). If it works at 360 it works everywhere.

## Non-negotiables

**No horizontal scroll, ever.** The page body must never scroll sideways. Wide
content scrolls *inside its own* `overflow-x-auto` container. Common causes:

- fixed `w-[Npx]` or `min-w-[Npx]` wider than ~320px
- `whitespace-nowrap` on anything that can hold a long name
- grids that never collapse to one column
- long unbroken strings (emails, references, CP IDs) without `truncate` or `break-words`

**44px minimum touch target.** Use `min-h-11` (44px) or `size="touch"` (48px).
Icon-only buttons get `size-11` minimum. Two adjacent targets need ≥8px between
them or thumbs hit the wrong one.

**Thumb zone.** Primary actions go in the bottom third. The top of a 6" phone is
the hardest place to reach. Destructive actions go *away* from the primary one.

**Type floor.** Body, values and anything interactive are `text-label` (13px) or
larger. `text-meta` (12px) is the floor for secondary copy. The single exception
is an uppercase micro-label with wide tracking, which may go to **11px**
(`text-[0.6875rem]`) and no lower. Never 10px: pickleball is played outdoors, in
sunlight, by people who are not holding the phone close.

**Bottom bar clearance.** `PlayerBottomNav` is fixed at `h-16` plus safe-area
inset. Any page it renders on needs `pb-24` (or `pb-28` when the page also has a
sticky action bar) or the last element is unreachable.

## Patterns that must be used

| Situation | Phone treatment |
|---|---|
| a form with a submit | sticky action bar above the tab bar |
| a detail view from a list | bottom sheet, not a new page |
| a wide table | record cards, or 3 key columns + tap through |
| a filter set | horizontally scrollable chip row |
| a long select (>6 options) | bottom sheet with search |
| a short select (≤6 options) | tiles or a segmented control, never `<select>` |
| a number input | stepper with −/+ buttons |
| a date | quick chips (Today / Tomorrow / This weekend) beside the picker |
| a stat group | 2-up grid, never one column of full-width cards |

## Layout rules

- Page gutter is `px-4` at phone, `px-6` at `sm`, `px-8` at `lg`
- Stack to **one column by default**; add `sm:grid-cols-2` upward, never the reverse
- A 2-up stat grid beats four stacked cards; four stacked cards waste the whole first screen
- Section rhythm `py-14 sm:py-20 lg:py-28`, not a single fixed value
- Headings scale: never ship one `text-5xl` that also has to survive 360px
- Buttons are `w-full` on phone, `sm:w-auto` above
- Modals become bottom sheets (`side="bottom"`, `h-[88svh]`)
- Navigation drawers slide from the **left**, never expand downward from the header

## Use `svh`, not `vh`

Mobile browser chrome makes `100vh` taller than the visible viewport, so a
`min-h-screen` page hides content behind the URL bar. Use `min-h-svh`.

## Scale type with the viewport, not with breakpoints

For anything that must be small on a phone and large on a display,
`text-[clamp(min,vw,max)]` beats a breakpoint ladder — it scales continuously
instead of jumping. Scoreboards, hero headlines, KPI numbers.

## Images

- Always `width`/`height` or `aspect-[]` to prevent layout shift
- Brand artwork **stays visible on phones** on identity and hero bands. It is
  part of the product's character, not decoration to strip. Make it work rather
  than hide it: confine the figure to the right ~44%, lay a left-to-right scrim
  over it (`from-surface-deep via-surface-deep/92 to-transparent`), and cap the
  text column at `max-w-[62%]` so nothing overlaps. Purely ornamental accents
  that carry no meaning may still drop below `sm`.
- Athlete cut-outs only over `bg-surface-deep` (matting fringe shows on light)
- Uploaded player photos always need an initials fallback

## Every player route must be reachable

A tab or menu entry pointing at a route the player's role cannot open renders a
403. Before adding any destination to `playerBottomNav` or the command menu,
confirm the route returns < 400 for `role = player`. `/live-courts`,
`/reservations`, `/pos`, `/players`, `/tournaments`, `/open-play` and `/matches`
are **operator routes** and all 403 for players.

## Checklist before calling a player page done

- [ ] no horizontal scroll at 360px
- [ ] every tap target ≥44px
- [ ] primary action reachable by thumb
- [ ] `pb-24` if the tab bar renders here
- [ ] `min-h-svh` not `min-h-screen`
- [ ] stats are 2-up, not stacked
- [ ] long values truncate rather than push the layout
- [ ] empty states have an action, not just a sentence
- [ ] no text below 12px (11px only for uppercase micro-labels)
- [ ] every link the page offers returns < 400 for a player
