# EAJ COURTPRIME — SENIOR UI/UX REDESIGN & FRONTEND MODERNIZATION

You are working on an EXISTING, FULLY FUNCTIONAL production application.

The existing CourtPrime business logic, Laravel backend, authentication, database,
multi-tenancy, permissions, global-player architecture, reservations, tournaments,
POS, memberships, scoring, reports, branches, courts, and other modules are already
implemented.

THIS TASK IS NOT TO REBUILD THE SYSTEM.

THIS TASK IS A COMPLETE SENIOR-LEVEL UI/UX REDESIGN AND FRONTEND POLISH PASS.

Act simultaneously as:

- Senior Product Designer
- Senior SaaS UI/UX Designer
- Senior Sports-Tech Art Director
- Senior React Frontend Engineer
- Design Systems Engineer
- Motion Designer
- Accessibility Reviewer
- Responsive UX Specialist

Use the installed frontend skills whenever available:

- frontend-app-builder
- frontend-testing-debugging
- react-best-practices
- Browser/Playwright skill if available

The finished product must look as though it was designed by a professional funded
SaaS product team and reviewed by an experienced Head of Product Design.

==================================================
1. NON-NEGOTIABLE RULE — PRESERVE FUNCTIONALITY
==================================================

DO NOT rewrite or remove working backend functionality.

DO NOT recreate Laravel architecture.

DO NOT create a new Next.js/Vite application.

Continue using the EXISTING:

Laravel 12
React
TypeScript where already supported
Tailwind CSS
shadcn/ui
Lucide icons
Motion for React / Framer Motion
Recharts
existing routing
existing authentication
existing APIs/Inertia architecture
existing permissions
existing tenant isolation
existing data models

Before changing anything:

1. Inspect package.json.
2. Inspect current React structure.
3. Inspect layout components.
4. Inspect shared components.
5. Inspect Tailwind configuration.
6. Inspect current shadcn components.
7. Inspect every major authenticated layout.
8. Inspect the landing page.
9. Inspect forms.
10. Inspect mobile behavior.
11. Inspect public assets under /public.
12. Run the application.
13. Capture screenshots of the current major pages.
14. Identify visual and UX problems before implementing.

Do not touch database schema or backend business logic unless a UI requirement
absolutely requires it.

All existing buttons, forms, tables, filters, APIs and workflows must continue to work.

==================================================
2. DESIGN QUALITY TARGET
==================================================

The current UI does NOT meet the quality target.

Upgrade the entire interface to a premium modern SaaS/sports-tech product.

The quality target should feel comparable in refinement to high-end modern products
such as Linear, Stripe, Vercel, modern sports applications and well-funded B2B SaaS,
WITHOUT copying any one company.

CourtPrime must have its OWN recognizable design language.

It should feel:

Premium
Fast
Modern
Confident
Professional
Sports-oriented
Enterprise-ready
Highly usable
Clean
Purposeful
Connected
Alive

Do NOT make it look like:

a generic Laravel admin template
a CRUD dashboard
a Bootstrap dashboard
a grid containing 20 identical cards
an AI-generated dashboard
an excessive neon esports website
a template marketplace theme
a collection of shadcn defaults
a giant form inside a white rectangle

The UI must look ART DIRECTED.

==================================================
3. COURTPRIME VISUAL THESIS
==================================================

Visual thesis:

"Premium sports technology with enterprise SaaS discipline."

Use CourtPrime's existing visual identity.

Primary palette:

Deep Navy
Midnight Navy
CourtPrime Blue
Electric Blue
CourtPrime Hot Pink
White
Cool Neutral Gray

Do NOT make every surface pink or blue.

Use pink mainly for:

primary action
live status
important highlights
selected state
brand moments

Use electric blue for:

secondary emphasis
network connections
data visualization
information state

Operational UI should remain calm and readable.

Avoid excessive gradients.

Avoid excessive glassmorphism.

Avoid excessive shadows.

Avoid excessive glow.

Use these effects only where they create depth or hierarchy.

==================================================
4. CREATE A REAL DESIGN SYSTEM FIRST
==================================================

Before redesigning individual pages, create/refactor a CourtPrime frontend design system.

Create reusable semantic tokens for:

background
surface
surface-raised
surface-muted
border
border-strong
text-primary
text-secondary
text-muted
primary
secondary
accent
success
warning
danger
live
available
reserved
maintenance

Create consistent:

spacing scale
container widths
page gutters
section spacing
border radius scale
shadow scale
typography scale
motion timing
easing curves
z-index layers

Do not hardcode random values on every page.

Typography must feel premium.

Establish clear hierarchy for:

display heading
page heading
section heading
card heading
body
secondary body
labels
metadata
table text
numeric KPI
microcopy

Use typography and spacing to create hierarchy BEFORE adding boxes.

==================================================
5. STOP PUTTING EVERYTHING INSIDE CARDS
==================================================

One major goal of this redesign is to remove the "dashboard made entirely of cards"
appearance.

Cards should exist only where the information genuinely behaves like a card.

Prefer:

open layouts
sections
rails
lists
tables
dividers
split layouts
data bands
sticky panels
drawers
side inspectors
timeline layouts
command palettes
segmented surfaces

Instead of wrapping every text group in a rounded rectangle.

Important rule:

If removing the outer card does not reduce comprehension, REMOVE THE CARD.

Use negative space deliberately.

==================================================
6. LANDING PAGE — COMPLETE REDESIGN
==================================================

The landing page is extremely important.

This page must immediately communicate that CourtPrime is TWO things connected together:

A. A centralized player network
B. A private operating system for independent pickleball businesses

It must visually communicate:

ONE PLAYER PROFILE
EVERY CONNECTED COURT

and:

SHARED PLAYER IDENTITY
PRIVATE BUSINESS OPERATIONS

Do not create a conventional SaaS page consisting of:

hero
three cards
six feature cards
pricing
footer

Build a VISUAL SCROLL STORY.

--------------------------------------------------
LANDING HERO
--------------------------------------------------

First viewport must feel like a premium product campaign.

Desktop composition:

Left:
Strong headline
short supporting copy
primary player CTA
business CTA
small trust statement

Right:
Use existing CourtPrime athlete artwork.

Use existing:

/cp-model5.png
/cp3(1).png
/cp-paddle3.png when appropriate

Add only 3–5 floating data surfaces maximum around the athlete.

Possible examples:

CP-PLY-000001
Global Rating 4.21
4 Connected Clubs
Next Match 7:30 PM
Global Rank #128

These floating elements should appear like real product UI.

Do NOT surround the athlete with 15 random cards.

Animation:

navigation fade
headline stagger reveal
CTA reveal
athlete rise + slight scale
profile surfaces settle into place
very subtle network-line animation

No excessive spinning.

No looping bouncing objects.

--------------------------------------------------
SCROLL STORY
--------------------------------------------------

Build a sophisticated scroll narrative.

SECTION 1 — ONE PLAYER IDENTITY

Show a single player profile in the center.

As the user scrolls:

Metro Pickle Club
Prime Pickle Center
Cebu Pickle Arena
other connected clubs

animate into connection with the SAME CourtPrime player identity.

Use animated network paths.

Communicate:

Register once.
Play everywhere.
Keep one verified record.

Use cp-model4.png if appropriate.

--------------------------------------------------

SECTION 2 — DISCOVER COURTS

Transition into court discovery.

Use a large, polished search/discovery composition rather than generic form fields.

Show:

location
nearby facilities
indoor/outdoor
availability
open play
tournaments
starting rates

Facility cards should feel like sports venue listings, not admin cards.

Use horizontal media layouts where appropriate.

--------------------------------------------------

SECTION 3 — BOOK FROM ONE ACCOUNT

Use cp-model1.png.

Desktop:

left or right = sticky booking product preview
opposite side = scroll progression

As the visitor scrolls:

Find Club
Choose Branch
Choose Court
Choose Time
Add Players
Add Rentals
Pay
Confirmed

Animate the product preview between states.

Do not show all steps simultaneously.

This section should feel like watching CourtPrime operate.

--------------------------------------------------

SECTION 4 — YOUR RECORD FOLLOWS YOU

Use cp-model3.png.

Show matches from different organizations flowing into ONE player timeline.

Animate history cards sequentially.

The emphasis is not the cards.

The emphasis is the connected chronological player history.

--------------------------------------------------

SECTION 5 — LIVE COURTPRIME NETWORK

Create a dark immersive section.

Show multiple live matches across different organizations.

Use live-score transitions.

Example:

Metro Pickle Club
COURT 03
11 - 8

Cebu Prime Courts
CHAMPIONSHIP COURT
7 - 5

Dumaguete Pickle Hub
COURT 02
OPEN PLAY

Use restrained LIVE animation.

--------------------------------------------------

SECTION 6 — GLOBAL RANKINGS

Leaderboard should animate vertically.

Do not simply show a table.

Use:

rank number
player identity
rating
trend
matches
club/city

Allow a visual transition between:

Global
City
Organization
Branch

--------------------------------------------------

SECTION 7 — TRANSITION TO BUSINESS OS

This is an important storytelling transition.

Visually shift from:

PLAYER EXPERIENCE

to:

COURT OWNER OPERATIONS

Use a darker enterprise surface.

Copy should explain:

"Connect your courts to the player network while keeping your business operations private."

Then reveal the CourtPrime Business OS.

--------------------------------------------------

SECTION 8 — BUSINESS OPERATING SYSTEM

Create a scroll-linked product showcase.

LEFT:
module navigation

Reservations
Live Courts
POS
Memberships
Tournaments
Inventory
Staff
Finance
Analytics

RIGHT:
large premium product preview

When scrolling or selecting each module, the right product preview changes.

Do not create nine identical cards.

Make this feel like a real SaaS product demo.

--------------------------------------------------

SECTION 9 — ANALYTICS

Use a sophisticated visual composition:

Revenue
Reservations
Occupancy
Court utilization
Peak hours
Retention
Membership growth
Branch comparison

Use actual Recharts components where interactive.

Use restrained animation when entering viewport.

--------------------------------------------------

SECTION 10 — FINAL CTA

High visual impact.

Use CourtPrime athlete or equipment artwork.

Player:
Find Your Next Court

Business:
Bring Your Club to CourtPrime

Keep footer clean.

==================================================
7. LANDING PAGE MOTION SYSTEM
==================================================

Use Motion for React / Framer Motion.

Implement meaningful motion:

useScroll
useTransform
whileInView
layout animations
AnimatePresence
spring transitions

Use scroll-linked animation only where it improves storytelling.

Recommended motion categories:

Hero entrance
Section reveal
Staggered rows/cards
Network connection drawing
Sticky product showcase
Parallax athlete art
Booking step morph
Score updates
Leaderboard movement
Count-up numbers
Navbar transformation
Drawer/modal transitions
Success confirmation

Animations must NOT make users wait.

Default duration:

roughly 180–500ms for UI transitions.

Longer cinematic motion may be used only for landing-page storytelling.

Respect:

prefers-reduced-motion

With reduced motion:

disable parallax
disable large transforms
disable unnecessary looping
keep opacity/simple state changes

==================================================
8. FORMS MUST BE COMPLETELY REDESIGNED
==================================================

The existing form UX is one of the biggest problems.

Stop using giant pages containing:

label
input
label
input
label
select
label
textarea
save button

inside one large generic card.

Design the FORM EXPERIENCE according to the task.

Use:

progressive disclosure
multi-step flows
selection tiles
segmented controls
combobox search
date selectors
visual time-slot buttons
contextual help
inline validation
sticky summaries
drawers
side sheets
bottom sheets on mobile
confirmation summaries
clear success states

--------------------------------------------------
RESERVATION FORM
--------------------------------------------------

Should NOT look like a database record editor.

It should feel like a booking application.

Use visual sequence:

Player
Court
Date
Time
Duration
Players
Add-ons
Payment
Confirmation

Use court cards.

Use clickable available time slots.

Use a sticky booking summary.

Use search/autocomplete for player.

On mobile use bottom sheets where appropriate.

--------------------------------------------------
OWNER SETTINGS FORMS
--------------------------------------------------

Use settings architecture.

Left:
settings navigation

Right:
focused setting area

Examples:

Business Profile
Branches
Reservations
Pricing
Payments
Notifications
Tax
Integrations
Security

Avoid one enormous settings form.

--------------------------------------------------
CREATE/EDIT OPERATIONAL RECORDS
--------------------------------------------------

Prefer drawer/slide-over when editing contextually.

Example:

Click reservation
→ inspector drawer opens
→ view/edit details
→ user never loses scheduler context

Use full pages only when the workflow genuinely needs one.

--------------------------------------------------
DEMO APPLICATION
--------------------------------------------------

Use premium multi-step onboarding.

Show progress.

One logical group at a time.

Do not show 25 fields simultaneously.

==================================================
9. PLAYER EXPERIENCE
==================================================

The player interface must feel like a modern SPORTS APP, not an admin dashboard.

Mobile-first.

Primary player page /me should emphasize:

Identity
What am I doing next?
Where can I play?
How am I performing?

Top area:

profile
CP Player ID
rating
rank
compact QR action

Then:

Next Reservation
Find a Court
Join Open Play
Upcoming Tournament

Then:

Recent Results
Rating Trend
Achievements
Connected Clubs

Use rich horizontal carousels/rails carefully on mobile where appropriate.

Do not use desktop admin sidebar navigation on mobile player pages.

Recommended mobile navigation:

Home
Discover
Play
Live
Profile

Use bottom navigation.

Desktop may use a compact app rail/top navigation.

==================================================
10. COURT OWNER EXPERIENCE
==================================================

Owner dashboard = EXECUTIVE BUSINESS COCKPIT.

Do not simply make eight KPI cards.

Top:

organization / branch context
date
important quick action
status

Create one strong metric band.

Example:

Revenue Today
Reservations
Occupancy
Active Courts
Players On-Site

Below:

large Revenue + Reservation visualization

Then:

LIVE OPERATIONS

Court 1 — Playing
Court 2 — Available
Court 3 — Open Play
Court 4 — Reserved

Then:

Branch Performance
Inventory Alerts
Membership
Staff
Upcoming Tournaments

Use varied layouts.

Use tables where tables are better.

Use lists where lists are better.

Use charts only when useful.

==================================================
11. STAFF / FRONT DESK
==================================================

This experience must be very operational.

The staff must immediately see:

WHAT IS HAPPENING NOW
WHAT IS NEXT
WHAT NEEDS ATTENTION

Prioritize:

Live Courts
Upcoming Reservations
Check-In Queue
Walk-Ins
Open Play Queue
Pending Payments
Court Issues

Large touch targets.

Use quick actions:

New Reservation
Check In
Walk In
Find Player
Open Play
Accept Payment

Avoid executive charts here.

==================================================
12. CASHIER
==================================================

Cashier should look like a fast POS workstation.

Focus on:

products/services
cart
customer/player
payment
current shift

Do not show unrelated analytics.

Desktop layout may use:

Product/search workspace — 65%
Cart/payment rail — 35%

Make checkout extremely obvious.

Touch-friendly.

==================================================
13. SUPERADMIN
==================================================

Superadmin should feel like an enterprise network control center.

Use:

platform navigation
network health
tenant growth
subscriptions
global players
connected courts
live network
billing
support
alerts

Information density can be higher than the player experience.

Still avoid excessive card mosaics.

==================================================
14. NAVIGATION REDESIGN
==================================================

Create different shells for different personas.

DO NOT use one generic sidebar and hide menu items.

Player:
sports app experience

Owner:
executive SaaS workspace

Staff:
operational workspace

Cashier:
POS workspace

Platform Superadmin:
network administration workspace

Use the same design language but different information architecture.

For desktop SaaS navigation:

Use compact sidebar/rail.

Clearly group modules.

Avoid 25 permanently visible items.

Use collapsible logical groups when needed.

Use command menu search:

Ctrl/Cmd + K

Support quick navigation/actions.

==================================================
15. TABLE DESIGN
==================================================

Tables must feel professional.

Use:

clear column hierarchy
comfortable row density
sticky headers where needed
subtle row hover
bulk selection only where needed
inline status
row actions
filters
saved views where useful
search
column visibility where useful

Do not put every table inside a giant floating card.

Tables can live directly on a structured page surface.

On mobile:

convert only appropriate tables into record cards.

Do not force horizontal table scrolling for simple datasets.

==================================================
16. DATA VISUALIZATION
==================================================

Use Recharts.

Charts should use the CourtPrime design system.

No rainbow charts.

Use navy / blue / pink strategically.

Prefer:

line
area
bar
stacked bar
donut only where truly appropriate

Always provide:

clear labels
tooltips
period controls
empty/loading states

==================================================
17. MICROINTERACTIONS
==================================================

Add polished feedback for:

reservation created
player checked in
payment completed
live score changed
rank moved
court status changed
tournament advanced
inventory warning
copy player ID
workspace switched

Use:

small scale
opacity
layout motion
check animation
number transitions

Avoid fireworks/confetti except perhaps very rare major player achievements.

==================================================
18. EXISTING COURTPRIME ARTWORK
==================================================

USE EXISTING ARTWORK.

Do not regenerate it.

Do not change faces.

Do not alter logos.

Do not stretch assets.

Primary assets include:

cp3(1).png
cp2(1).png
cp1(1).png
cp.png

cp-model5.png
cp-model4.png
cp-model3.png
cp-model1.png

cp-paddle.png
cp-paddle2.png
cp-paddle3.png
cp-paddle4.png

Preserve aspect ratios.

Use object-contain where appropriate.

Do not overlap artwork over critical text/controls.

==================================================
19. RESPONSIVE DESIGN
==================================================

Every redesigned surface must work at minimum at:

1440 desktop
1280 desktop
1024 tablet landscape
768 tablet
430 mobile
390 mobile
360 mobile

Do NOT simply shrink desktop.

Redesign information architecture for mobile.

Mobile:

replace sidebars
use bottom navigation where appropriate
use sheets
use stacked summaries
reduce decorative artwork
keep primary actions within thumb reach

==================================================
20. ACCESSIBILITY
==================================================

Maintain WCAG-conscious contrast.

Visible keyboard focus.

Correct form labels.

ARIA where necessary.

Semantic buttons.

Do not communicate status through color alone.

Touch targets should generally be at least ~44px.

Respect reduced motion.

==================================================
21. PERFORMANCE
==================================================

Premium does NOT mean heavy.

Keep the site fast.

Lazy load below-the-fold marketing artwork.

Only preload hero-critical assets.

Avoid huge PNG rendering when a smaller responsive derivative works.

Avoid layout shift.

Avoid expensive scroll event handlers.

Use Motion values or IntersectionObserver.

Pause offscreen animations.

Avoid large blur filters.

Avoid excessive backdrop-filter.

Preserve responsive image dimensions.

==================================================
22. COMPONENT ARCHITECTURE
==================================================

Refactor toward reusable UI families.

Examples:

MarketingShell
AppShell
PlayerShell
OwnerShell
OperationsShell
CashierShell
SuperadminShell

PageHeader
ContextBar
MetricBand
Stat
StatusBadge
LiveBadge
CourtStatus
PlayerIdentity
PlayerAvatar
ClubCard
ReservationRow
ReservationInspector
BookingSummary
LiveScore
LeaderboardRow
ActivityTimeline
CommandMenu
EmptyState
LoadingSkeleton
DataToolbar
FilterBar
DrawerForm
SettingsSection
ChartFrame

Do not create gigantic 1000-line page components.

Do not duplicate visual patterns across pages.

==================================================
23. BROWSER QA IS MANDATORY
==================================================

A successful compile is NOT enough.

After every major page redesign:

1. Run the application.
2. Open the actual page in Browser/Playwright.
3. Capture a desktop screenshot.
4. Capture a mobile screenshot.
5. Inspect typography.
6. Inspect spacing.
7. Inspect alignment.
8. Inspect overflow.
9. Inspect forms.
10. Inspect interactions.
11. Check browser console.
12. Fix visual issues.
13. Repeat until it passes senior design review.

Specifically look for:

overlap
clipping
bad wrapping
too many cards
huge empty spaces
tiny text
inconsistent radius
inconsistent shadows
misaligned icons
inconsistent buttons
unbalanced whitespace
poor responsive behavior
mobile overflow
awkward forms
weak hierarchy
unreadable charts
excessive animation

DO NOT stop after one implementation attempt.

Use an iterative:

IMPLEMENT
→ RUN
→ SCREENSHOT
→ REVIEW
→ FIX
→ VERIFY

loop.

==================================================
24. REDESIGN ORDER
==================================================

Perform the redesign in this order:

1. Audit current UI.
2. Establish global design tokens.
3. Typography.
4. Buttons / controls / status system.
5. Application shells and navigation.
6. Landing page.
7. Authentication.
8. Player experience.
9. Owner experience.
10. Staff/front desk.
11. Cashier.
12. Superadmin.
13. Reservation / booking UX.
14. Forms.
15. Tables.
16. Drawers / dialogs.
17. Reports / analytics.
18. Mobile UX.
19. Motion polish.
20. Accessibility.
21. Performance.
22. Full browser QA.

Do not randomly redesign isolated components before defining the system.

==================================================
25. SENIOR DESIGN REVIEW GATE
==================================================

Before declaring the redesign complete, ask internally:

Would a senior product designer approve this?

Would this look credible in a SaaS sales presentation?

Would a club owner be comfortable using this for 8 hours every day?

Would a pickleball player enjoy using this on their phone?

Does this still look like generic shadcn?

Is there too much card chrome?

Are forms task-oriented instead of database-oriented?

Is visual hierarchy obvious within 3 seconds?

Is every animation meaningful?

Does mobile feel intentionally designed?

If any answer is NO, continue improving.

==================================================
26. IMPORTANT AUTONOMY RULE
==================================================

Do not ask me for approval for every small visual decision.

You are authorized to redesign frontend presentation and interaction architecture.

Use senior UI/UX judgment.

Ask me only when:

a backend/business behavior must change
a working feature would need removal
a major product requirement is ambiguous
data/security behavior would be affected

Otherwise continue autonomously.

==================================================
FINAL EXPECTATION
==================================================

I do not want a cosmetic reskin.

I want CourtPrime to feel like a completely mature premium SaaS product.

Functionality already exists.

Now make the EXPERIENCE match the strength of the system.

The final UI should communicate:

ONE PLAYER IDENTITY.
EVERY CONNECTED COURT.
ONE PREMIUM PICKLEBALL ECOSYSTEM.

Deliver a visual experience that would pass review from a senior UI/UX designer,
senior frontend engineer and professional SaaS product team.