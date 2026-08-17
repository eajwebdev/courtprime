# CourtPrime Phase 1 Audit

## Existing Architecture

- Laravel 12 backend with Inertia React frontend.
- React/TypeScript resources live under `resources/js`.
- shadcn-style UI components already exist under `resources/js/components/ui`.
- Authentication already uses a single `/login` route.
- Operational modules already exist for branches, courts, reservations, check-in, live courts, POS, cashier sessions, inventory, matches, open play, and rankings.

## Brand Assets

The expected CourtPrime artwork exists in `public/`, but the logo filenames differ from the prompt:

- Existing: `cp1.png`, `cp2.png`, `cp3.png`
- Prompt examples: `cp1(1).png`, `cp2(1).png`, `cp3(1).png`

Athlete and equipment assets exist with the requested names:

- `cp-model1.png`
- `cp-model3.png`
- `cp-model4.png`
- `cp-model5.png`
- `cp-paddle.png`
- `cp-paddle2.png`
- `cp-paddle3.png`
- `cp-paddle4.png`
- `cp.png`

## Key Architecture Gap Found

The existing `players` table is tenant-scoped with `organization_id`, which conflicts with the required CourtPrime rule:

> One global player identity. Many independent organizations. Strict tenant privacy.

To avoid destructive schema changes, the first implementation step adds a new global identity layer:

- `player_profiles` for global CourtPrime player identity.
- `organization_players` for organization-specific player/customer data.
- Existing tenant-scoped `players` records can be linked through `legacy_player_id` during migration work.

## Phase 2 Foundation Added

- Explicit platform role enum.
- Organization-scoped user role model/table.
- Tenant context service.
- Server-authorized workspace switch route.
- Shared Inertia workspace props.
- Sidebar workspace switcher.
- Login audit table and successful/failed login recording.
- Organization policy baseline.
- Player identity bridge service:
  - New player form creates/reuses one global `player_profiles` record.
  - Each organization gets its own `organization_players` relationship.
  - Existing tenant-scoped `players` rows are preserved as compatibility records through `legacy_player_id`.
  - Reservation walk-ins now go through the same identity bridge.
- Tenant authorization hardening:
  - Shared tenant resource policy registered for tenant-owned operational models.
  - Controllers now call policies before listing or mutating reservations, players, courts, branches, POS, payments, inventory, matches, open play, and cashier sessions.
  - Cross-organization resources are denied server-side.
  - Branch-scoped users are denied mutations against another branch in the same organization.
- Role-aware app shell:
  - Sidebar navigation now changes by active CourtPrime role/workspace.
  - Workspace switcher shows the current organization, branch, and role even when only one workspace is available.
  - Header/mobile navigation uses the same role-aware menu source.
  - Header search now opens a Ctrl/Cmd+K global search dialog backed by role-aware tenant, player/public, and superadmin result scoping.
  - Top bar now includes quick-create shortcuts for reservations, player links, POS sales, Open Play, and tournaments.
  - Sidebar navigation now supports cached badge counts for reservations, pending payments, stock alerts, support, demos, and unread notifications.
  - Removed Laravel starter-kit repository/documentation links from the authenticated shell.
- Role-specific dashboards:
  - Dashboard backend now returns separate modes for Superadmin, owner/manager, front desk, cashier, sports roles, and player.
  - Removed hardcoded dashboard demo values in favor of real reservation, payment, POS, court, open play, and player identity aggregates.
  - React dashboard renders role-specific panels, quick actions, and summary links.
  - Tests assert cashier and scorekeeper receive their correct dashboard modes.
- Phase 4 business foundation:
  - Branches can now be created from the authenticated app with workspace-scoped validation, operating hours, tax, currency, and contact details.
  - Courts can now be created from the authenticated app with branch ownership, court numbers, surface/environment details, rate fields, amenities, and status.
  - Team & Roles provides staff assignment against organizations/branches using server-side role checks.
  - Organization Settings exposes tenant identity, booking rules, privacy posture, subscription plan details, and branch/court/staff usage.
- Phase 3 player network foundation:
  - Player directory entries now open a CourtPrime identity page backed by the global `player_profiles` record.
  - Unclaimed provisional identities can be claimed by the matching logged-in user.
  - Player-owned privacy flags control public rating, city, connected clubs, and match count visibility.
  - Public player identity URLs are available for check-in/QR payload workflows without exposing tenant private notes or payments.
  - Added `/me` as a signed-in player portal with global identity, upcoming bookings, connected clubs, separated organization wallet balances, memberships, tournaments, open play, and achievements.
  - Player-only logins now resolve to the player portal while other roles continue to land on persona-appropriate workspaces.
  - QR identity now uses signed, versioned URLs with rotation support instead of exposing database IDs.
  - Global player achievements now attach to `player_profiles` with optional organization/tournament context.
  - Staff can award public or organization-visible achievements from the player identity page.
  - Public player profiles display achievements only when the player's privacy settings allow it.
  - EAJ superadmins now have a duplicate identity review page for profiles sharing email or mobile identifiers.
- Phase 6 core operations:
  - Internal reservation creation already uses server-side court availability conflict checks.
  - Scheduler now exposes branch/date filters against server-calculated availability slots.
  - Public `/find-courts` discovery lists active courts across connected organizations without exposing private tenant operational data.
  - Signed-in players can now book active connected courts from `/me/book` using server-side availability, pricing, and global identity linking.
  - Added tenant-scoped maintenance work orders with branch/court assignment, staff assignment, priority/status tracking, optional court availability blocking, and automatic court maintenance/available status transitions.
  - Added staff management with employee profiles, branch assignment, contact/hire/status details, and optional attendance entries for time-in/time-out tracking.
- Phase 7 commerce foundation:
  - Stock transfers can now be drafted, sent, and received with inventory movement history.
  - Transfer-out movements now enforce stock availability.
  - Branch-scoped users can only act on stock transfers involving their active branch workspace.
  - POS transactions now have a receipt page backed by transaction line items and payment data.
  - Payment ledger now supports tenant-scoped refund recording with remaining-balance validation, payment status updates, refund history, and branch-aware access control.
  - Added expense management for branch costs, categories, suppliers, payment methods, receipts, notes, approvers, and paid/approval status tracking.
  - Added accounts receivable for outstanding customer balances, partial payments, overdue/open/settled status, player/reservation linkage, and cashier/manager payment recording.
- Phase 8 sports-engine foundation:
  - Live scored matches now support final-score verification.
  - Match disputes/correction requests are stored as tenant-owned records linked to the match.
  - Scorekeeper UI exposes verification status, dispute submission, and dispute history.
  - Open Play queue management now supports queue-priority, skill-balanced, random, winner-stays, and manual group building with optional court assignment.
  - Rankings now expose both CourtPrime global player identity standings and organization-scoped club standings.
  - Added `/players/rankings` as the player-network ranking route while preserving the existing authenticated `/rankings` route.
  - Added private broadcast events and tenant-aware channel authorization for live match scores, reservation status changes, court status changes, and tournament bracket updates.
- Phase 9 competition foundation:
  - Added tenant-scoped tournaments, tournament divisions, and tournament registrations tables/models.
  - Tournament directors and tenant managers can create tournaments with an opening division.
  - Tournaments are now available in role-aware navigation and have a command-center page.
  - Public tournament discovery is available at `/find-tournaments`.
  - Public tournament registration now links signups through the global CourtPrime player identity service and tenant-owned `organization_players`.
  - Tournament command center now shows division registration counts, recent rosters, and public discovery access.
  - Added tenant-scoped tournament bracket matches and a bracket generator for registered division teams.
  - Tournament command center now displays first-round bracket matches, seeds, byes, and regenerate controls.
- Phase 10 membership/customer foundation:
  - Added tenant-scoped membership plans, player memberships, player waivers, and CRM notes.
  - Membership plans and player membership assignment are available from the authenticated app.
  - Membership data is linked through `organization_players` and `player_profiles` while keeping private customer data tenant-owned.
  - Player identity pages now show organization memberships and waiver history.
  - Waivers can be recorded against the organization-player relationship.
  - Added reusable tenant waiver templates with required-before-booking flags and accepted-waiver counts.
  - Accepted player waivers can now link back to the selected tenant waiver template/version.
  - Private CRM notes can be saved by tenant-authorized staff only and are not exposed on public/global identity views.
  - Notification Center shows in-app alerts for the active workspace/player identity.
  - Added tenant announcements with audience targeting, branch targeting, scheduling, publish status, and role-aware navigation.
  - Added organization-owned wallet balances on `organization_players` plus a player `/me/wallet` page that keeps balances separated by club.
  - Added tenant-scoped coach directory records with branch assignment, specialties, hourly rate, and role-aware navigation.
  - Added signed-in player profile management at `/me/profile` for global identity details and privacy controls.
  - Added reusable activity timeline events and surfaced recent player identity activity for claims, privacy changes, waivers, CRM notes, and achievements.
- Phase 11 intelligence foundation:
  - Added a Reports page with workspace-scoped revenue, reservations, player visits, active players, average ticket, daily trends, and court usage analytics.
  - Reports now include court heatmap peaks, player activity leaders, and explicit network-level metrics for EAJ superadmins.
  - Reports now include refunds, approved/paid expenses, net revenue, and basic profitability for the selected date range.
- Phase 13 public website polish:
  - Landing page now uses the official CourtPrime logo and supplied athlete/equipment artwork.
  - Public CTAs include Request a Live Demo, See How It Works, Find Courts, and Find Tournaments.
  - Footer links now route to real CourtPrime privacy and terms pages.
  - Added public CourtPrime global leaderboards at `/leaderboards`.
  - Added public connected-club pages at `/clubs/{slug}` and linked them from court discovery.
  - Added public Open Play discovery at `/find-open-play`.
  - Added public live match player view at `/live/matches/{match}` and linked it from the live court display.
- Phase 12 SaaS platform foundation:
  - Subscription plan branch/court limits now enforce real branch and court creation limits.
  - EAJ superadmins can now create subscription plans and configure plan feature flags/limits.
  - EAJ superadmins can assign tenant plans, billing cycles, trial/period dates, and subscription lifecycle status.
  - Added platform subscription invoices, subscription payments, and subscription event timeline records.
  - Tenant Subscriptions now supports invoice issuance, payment recording, and billing timeline review.
  - Subscription feature flags now gate paid modules such as POS, memberships, Open Play, tournaments, inventory, and reports.
  - Organization Settings displays current subscription plan and usage against plan limits.
  - Added tenant onboarding at `/onboarding` with setup progress, launch checklist, module quick links, and persisted progress in organization settings.
  - Added SaaS support tickets with customer replies, superadmin internal notes, status updates, and notification events.
  - Added an EAJ superadmin demo pipeline for public demo requests, assignment, follow-up scheduling, notes, and sales status tracking.
  - Demo pipeline leads can now be converted into trial tenant organizations with an initial subscription plan.
  - Demo-mode organizations now surface a persistent authenticated top-bar badge through shared workspace context.
- Phase 14 security/polish foundation:
  - Added reusable CourtPrime marketing artwork components for wordmarks, compact icon usage, athlete art, and equipment art.
  - Added CourtPrime favicon/apple-touch icon links, image preload hints, and CourtPrime app-name fallbacks.
  - Added PWA manifest metadata, conservative service-worker registration, mobile app meta tags, and branded no-JavaScript fallback.
  - Added branded error pages for 403, 404, 419, 422, 429, 500, and 503 responses.
  - Expanded organization settings with branding, colors, receipt footer, payment methods, membership renewal, notification channels, live display controls, integration placeholders, and API-readiness toggles.
  - POS receipts and live lobby display now read tenant branding settings while preserving CourtPrime attribution unless white label is enabled.
  - Live TV display now supports `?branch=` filtering, optional organization display tokens stored as hashes in tenant settings, tenant-configured page rotation, and compact CourtPrime icon fallback branding.
  - Added API credential readiness with organization-scoped hashed tokens, one-time token reveal, ability selection, expiry, revoke flow, role-aware navigation, and read-only CourtPrime API endpoints for courts, reservations, scores, tournaments, players, and rankings.
  - Added conservative production security headers for web and API responses.
  - Added a branch timezone clock service and applied branch-local day handling to dashboards, check-in, operations, nav badges, reservation/POS/payment/cashier/transfer/receivable/maintenance reference generation, and payment ledger summaries.
  - Added scheduled/queued reservation reminders with a CourtPrime Artisan command, fifteen-minute scheduler entry, Laravel notification mail, in-app notification records, and a reminder-sent reservation marker.
  - Added reusable PageHeader, StatsCard, EmptyState, CurrencyDisplay, PlayerAvatar, FloatingSportAccent, and MarketingVisualFrame components and applied them to receivables and the public landing page.
  - Added reusable DataTable, DateRangePicker, ConfirmDialog, and PageSkeleton components, then applied them to reports and payment/refund workflows.
  - Expanded the landing page motion system with reduced-motion-aware hero and feature-card reveals while preserving the supplied CourtPrime artwork.
  - Added authenticated flash success toasts so completed actions surface as polished CourtPrime feedback.
  - Added authenticated app skip-link accessibility support with a stable main-content landmark target.
  - Added platform audit logs for EAJ superadmin privileged route access and mutation events.
  - Added a superadmin Platform Audit page at `/platform-audit`.
  - Extended audit logging to authenticated sensitive tenant mutations, route model identifiers, and old/new value snapshots where a route-bound model is available.

## Verification

- Previous checkpoint: `php artisan test` passed.
- Previous checkpoint: `npm run build` passed.
- Current post-checkpoint changes are pending the final all-at-once verification per instruction.
