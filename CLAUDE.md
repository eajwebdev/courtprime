# EAJ CourtPrime

Multi-tenant pickleball club operating system + centralized player network.
Laravel 12 · Inertia 2 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion 13 · Recharts 3.

**Positioning:** one player identity, every connected court. Shared player identity,
private business operations.

## Current work: senior UI/UX redesign

The backend is finished and correct. The work in flight is a **frontend
presentation and interaction redesign only** — see `ui-prompt.md`.

Do not rewrite backend logic, Laravel architecture, auth, permissions, tenant
isolation, or data models. Do not create a new Next.js/Vite app. Every existing
button, form, table, filter, API and workflow must keep working.

## Skills — load these, they are not optional

| Before you… | Load |
|---|---|
| touch any `.tsx` or CSS | `courtprime-design-system` |
| place any image or logo | `courtprime-brand-assets` |
| write any `motion.*` / scroll animation | `courtprime-motion` |
| edit a layout, sidebar, or navigation | `courtprime-shells` |
| write a form or table | `courtprime-forms` |
| finish a page | `ui-qa-loop` |
| build a chart | `dataviz` (built-in) |

## Layout

```
resources/js/
  app.tsx            Inertia entry
  pages/             ~60 page components (one per route)
  layouts/           app-layout, auth-layout, settings
  components/        shared; components/ui = shadcn primitives
  components/marketing-artwork.tsx   ALL brand imagery routes through here
  lib/navigation.ts  role → nav groups
  lib/format.ts      currency, dates
  lib/motion.ts      shared motion presets
resources/css/app.css   design tokens (@theme + :root/.dark)
public/                 cp*.png brand assets
```

## Commands

```bash
npm run dev          # vite
php artisan serve    # http://127.0.0.1:8000
npx tsc --noEmit     # type check
npm run lint         # eslint --fix
npm run format       # prettier
npm run build
php artisan test
```

## Roles

`eaj_superadmin` · `organization_owner` · `branch_manager` · `front_desk` ·
`cashier` · `scorekeeper` · `tournament_director` · `player`

Each maps to a persona shell — see `courtprime-shells`.

## Conventions

- Tailwind v4: tokens in `@theme` in `app.css`; there is no `tailwind.config.js`
- Path alias `@/` → `resources/js/`
- 4-space indent, single quotes, prettier with organize-imports + tailwind plugins
- Pages stay thin — compose from `components/`. A page over ~250 lines needs extraction.
- Inertia `<Link>` for navigation, `useForm` for submissions
- Money through `lib/format.ts` `currency()`, never raw `toFixed`

## Known asset trap

`cp1.png` has **white** "Court" text (dark backgrounds only).
`cp2.png` has **navy** "Court" text (light backgrounds only).
`cp3.png` is a damaged duplicate of `cp1` — do not use.
Getting this wrong renders the logo invisible. See `courtprime-brand-assets`.
