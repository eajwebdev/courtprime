---
name: courtprime-brand-assets
description: Which CourtPrime image goes where, and which background each logo is legal on. Load before placing any <img>, logo, hero art, athlete artwork, paddle art, empty-state illustration, or before editing components/marketing-artwork.tsx.
---

# CourtPrime Brand Assets

All assets live in `/public` and are served from `/`. **Never regenerate, recolor,
stretch, or crop faces.** Always `object-contain`. Always set `width`/`height` or
`aspect-[]` to prevent CLS.

Route every image through `components/marketing-artwork.tsx`. Do not write a bare
`<img src="/cp-...">` in a page.

## Logos — background rules are strict

| File | What it is | Legal background |
|---|---|---|
| `cp.png` | 3D CP monogram, transparent, square | any. Favicon, PWA icon, collapsed rail, avatar fallback. **Never render below 24px** — the bevel turns to mud |
| `cp1.png` | lockup, "Court" **white** + "Prime" pink, 3:1 | **DARK ONLY** — navy nav, dark footer, dark hero, immersive bands, auth navy panel |
| `cp2.png` | lockup, "Court" **navy** + "Prime" pink | **LIGHT ONLY** — light nav, receipts, invoices, PDF reports, light sidebar header |
| `cp3.png` | near-duplicate of `cp1` with visible compression artifacts on the letterforms | **do not use** — kept only for backwards compat |

`BrandWordmark` variants map: `dark` → `cp1.png` (for use ON dark),
`light` → `cp2.png` (for use ON light). The variant names the **background**,
not the ink.

## Athletes

All four are transparent PNGs. **All four carry faint red/yellow matting fringe
around the flying hair.** It is invisible on deep navy and obvious on white.
→ Composite athletes over `bg-surface-deep`, or give them a soft radial navy
backdrop. Never drop an athlete straight onto `bg-surface`.

| File | Subject | Placement |
|---|---|---|
| `cp-model5.png` | **duo** — woman + man, pink/blue energy swirl baked in, tall portrait | **landing hero, right side.** Two figures carry the "network" thesis. The swirl already supplies the glow — do **not** add gradient blobs behind it. Also final CTA. |
| `cp-model4.png` | single man, ready stance, clean | **Section 1 "One Player Identity"** — one figure = one identity. Also auth/register split panel. |
| `cp-model1.png` | woman lunging, strong diagonal | **Section 3 "Book From One Account"** — the diagonal reads as forward motion beside the sticky booking preview. |
| `cp-model3.png` | woman, ready stance, calm | **Section 4 "Your Record Follows You."** Also `/me` empty states, achievements. |

## Equipment

| File | What it is | Placement |
|---|---|---|
| `cp-paddle3.png` | pink ball + blue/pink comet trail, transparent, dynamic | **the LIVE motif.** Live network section, live badge accent, score-change microinteraction, floating hero element, PWA splash |
| `cp-paddle.png` | one paddle + ball with trail, transparent | discovery accent, "no courts found" empty state, 404, loading |
| `cp-paddle4.png` | crossed paddles + ball, symmetric, transparent | tournaments, versus/match visuals, open play, matches empty state |
| `cp-paddle2.png` | crossed paddles **on a baked-in dark background**, not transparent, carries its own "CourtPrime" branding | full-bleed banner only — Business-OS transition band, dark auth panel. **Never on a light surface**, it brings its own dark rectangle. Never inside a small card. |

`logo.svg` is the stock Laravel logo. Ignore it.

## Performance — mandatory

The 12 PNGs total ~14 MB. `cp-model5.png` alone is 2.2 MB and it is the hero.

- Ship `.webp` derivatives at 2–3 widths, `<picture>` with PNG fallback
- `fetchpriority="high"` + eager **only** on the hero athlete; everything else `loading="lazy"`
- Always pass explicit `width`/`height`
- Below-the-fold marketing art: lazy + `content-visibility: auto`
- Do not animate a 2 MB PNG's `filter` or `box-shadow` — transform/opacity only

## Never

- athlete artwork overlapping text or controls
- more than one athlete per viewport
- artwork inside a data table, form, or operational panel
- a logo on a background it is not legal on (check the table above)
- reduce decorative artwork on mobile — see `courtprime-shells`
