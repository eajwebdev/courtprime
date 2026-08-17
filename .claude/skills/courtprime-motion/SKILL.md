---
name: courtprime-motion
description: Framer Motion timings, easing, scroll-linked patterns and reduced-motion rules for CourtPrime. Load before writing any motion.* component, useScroll/useTransform, whileInView, AnimatePresence, transition, or any animated landing section.
---

# CourtPrime Motion

Import from `framer-motion` (v13 is installed). Use the shared presets in
`resources/js/lib/motion.ts` — do not retype durations inline.

## Budget

| Category | Duration | Easing |
|---|---|---|
| micro (hover, press, checkbox, badge) | 120–180ms | `easeOut` |
| UI transition (tab, popover, toast, accordion) | 180–260ms | `easeOut` |
| overlay (drawer, sheet, modal) | 260–360ms | `easeInOut` |
| section reveal on scroll | 400–500ms | `easeOut` |
| cinematic (landing storytelling only) | up to 900ms | spring |

**Nothing in the authenticated app exceeds 360ms.** Operators use this eight
hours a day; animation that makes them wait is a defect.

Standard easing: `[0.16, 1, 0.3, 1]` (the CourtPrime curve — fast out, soft settle).
Spring for physical/settling motion: `{ type: 'spring', stiffness: 260, damping: 30 }`.

## Only animate transform and opacity

`x` `y` `scale` `rotate` `opacity`. That is the list.

Never animate `width`, `height`, `top`, `left`, `box-shadow`, `filter`,
`backdrop-filter`, or `background-position` — they hit layout/paint every frame.
For size changes use `layout` / `layoutId`.

## Reduced motion — mandatory

```tsx
const reduce = useReducedMotion();
```

With reduced motion: **keep opacity and color, drop everything else.**

- no parallax, no scroll-linked transforms
- no translate/scale entrances — fade only
- no looping animation of any kind
- `AnimatePresence` still fine, but fade not slide
- duration collapses to 0 for entrances

Use the `useReveal()` hook from `lib/motion.ts`; it already branches on
`useReducedMotion()`. Do not hand-roll the ternary in every file — the codebase
already has that duplication and it is being removed.

## Patterns

**Section reveal** — `whileInView` with `viewport={{ once: true, margin: '-80px' }}`.
Always `once: true`. Re-animating on scroll-up is amateur.

**Stagger** — `delayChildren: 0.06`, `staggerChildren: 0.05`. Cap the visible
stagger at ~8 children; beyond that the last item feels broken. For long lists
stagger only the first 8 and render the rest immediately.

**Scroll-linked** (`useScroll` + `useTransform`) — landing page only, and only
where it carries the story: the booking step morph, the network line draw, the
sticky product showcase, the athlete parallax. Never on an operational screen.

Always scope `useScroll` to a ref (`{ target: ref, offset: [...] }`). A global
scroll listener on a long page is a performance bug.

**Number transitions** — count-ups and score changes use `animate()` on a
motion value with `tabular-nums` on the element. Never re-render per frame.

**Live pulse** — one subtle opacity pulse, 2s, on the LIVE dot only. Not on the
card, not on the border, not on multiple elements at once.

## Landing storytelling

Cinematic motion is allowed only above the fold and in the scroll story. It must
never delay a CTA becoming clickable — buttons are interactive from frame 1 even
if still fading in.

The network-connection draw uses SVG `pathLength` 0→1, `easeInOut`, ~800ms,
triggered by `whileInView`. Lines draw once and stay.

## Banned

- looping bounce, float, or spin on decorative objects
- confetti / fireworks, except a single rare major player achievement
- entrance animation on a table row, list item, or form field
- animating the page shell, sidebar, or nav on every route change
- `transition={{ duration: 1.5 }}` anywhere in the app shell
- more than one thing moving in the viewport at a time on operational screens

## Microinteraction targets

Reservation created, player checked in, payment completed, live score changed,
rank moved, court status changed, tournament advanced, inventory warning,
player ID copied, workspace switched.

Each gets **one** small feedback: scale 0.98→1, a color settle, a check draw, or
a number roll. 150ms. Nothing more.
