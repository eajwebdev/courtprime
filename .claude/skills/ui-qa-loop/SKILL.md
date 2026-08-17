---
name: ui-qa-loop
description: The mandatory implement→run→screenshot→review→fix verification loop for CourtPrime UI work, with the visual defect checklist and senior design review gate. Load after finishing any page or major component redesign, before reporting it done.
---

# UI QA Loop

**A successful compile is not evidence of anything.** No UI change is done until
it has been seen.

## The loop

```
IMPLEMENT → RUN → SCREENSHOT → REVIEW → FIX → VERIFY
```

Repeat until the review gate passes. One pass is never enough.

## Running

```bash
npm run dev            # vite
php artisan serve      # app on http://127.0.0.1:8000
```

Type-check and lint before looking at pixels — they are cheaper:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Screenshots

Requires the Playwright MCP server:

```
claude mcp add playwright -- npx @playwright/mcp@latest
```

For each redesigned page capture **1440 desktop** and **390 mobile** minimum.
If it has a table or a form, also capture **768**.

Then read the console. A page with React key warnings, hydration errors, or 404s
on assets has not passed, regardless of how it looks.

## Visual defect checklist

Check every one of these against the screenshot, not against the code:

**Layout** — overlap · clipping · mobile horizontal overflow · unbalanced
whitespace · huge dead areas · content wider than its container · sticky element
covering content

**Type** — bad wrapping · orphans in headings · text under ~12px · weak hierarchy
(can't identify the page's subject in 3 seconds) · inconsistent capitalization

**System** — inconsistent radius · shadows on static panels · misaligned icons ·
buttons of differing heights in one row · raw hex leaking through · more than one
primary action

**Card soup** — count the bordered boxes. More than 3 identical groups = fail.

**Data** — unreadable charts · missing empty state · missing loading state ·
numbers without `tabular-nums` jittering

**Motion** — anything over 360ms in-app · looping decoration · animation blocking
interaction · not honoring `prefers-reduced-motion` (test it: emulate the media
feature and re-screenshot)

**A11y** — invisible focus ring · touch target under 44px · status conveyed by
color alone · unlabeled input · clickable `<div>`

## Review gate

Answer honestly. Any "no" means keep working.

1. Would a senior product designer approve this?
2. Would it look credible in a SaaS sales deck?
3. Would a club owner use it comfortably for 8 hours?
4. Would a player enjoy it on their phone?
5. Does it still look like default shadcn?
6. Is there too much card chrome?
7. Are the forms task-oriented rather than schema-oriented?
8. Is the visual hierarchy obvious within 3 seconds?
9. Is every animation carrying meaning?
10. Does mobile feel designed, or just narrowed?

## Non-negotiable

Never report a UI task complete on the strength of a clean build. If screenshots
could not be captured, say so explicitly rather than implying the page was
verified.
