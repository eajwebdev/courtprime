# EAJ CourtPrime

## Centralized Pickleball Network + Enterprise Club, Court & Tournament Management Platform

Build a complete, production-ready, enterprise-grade SaaS platform called:

# EAJ CourtPrime

Tagline:

**One Player Identity. Every Connected Court. One Powerful Operating System for Pickleball.**

Secondary description:

**A centralized multi-tenant pickleball ecosystem connecting independent court owners, clubs, branches and tournaments while giving every player one CourtPrime identity, one verified playing record and one account across all participating facilities.**

---

# 1. EXISTING PROJECT

I already have an existing:

* Laravel 12 backend
* React frontend
* Tailwind CSS
* shadcn/ui
* Existing authentication structure

Do NOT create a separate Next.js application.

Do NOT replace Laravel.

Continue using the existing Laravel 12 + React architecture.

If the project currently uses Inertia.js, continue using Inertia.js.

If APIs are already being used between Laravel and React, preserve the existing architecture.

Use:

* Laravel 12
* PHP 8.3+
* React
* TypeScript where supported by the existing project
* Tailwind CSS
* shadcn/ui
* Lucide React icons
* Framer Motion / Motion for React for animations
* Recharts for analytics
* Laravel Queues
* Laravel Scheduler
* Laravel Notifications
* Laravel Policies
* Laravel Events
* Laravel Broadcasting / WebSockets for live scoring
* Laravel Sanctum when APIs are required

Do not unnecessarily introduce another frontend framework.

---

# 2. BRAND ASSETS


Use the CourtPrime assets that already exist inside the Laravel project's `public/` directory.

Do not replace these with generic icons, stock logos, generated substitutes, or redesigned branding.

The React frontend should reference them using root-public paths such as:

```tsx
<img src="/cp3(1).png" alt="CourtPrime" />
```

When used from Blade, use the Laravel public asset helper where appropriate.

## Official logo files

### `public/cp3(1).png`
Approximate source size: 2048 × 682.

Purpose:
**Primary dark-background horizontal CourtPrime wordmark.**

Use on:

* Dark landing-page navbar
* Dark hero section
* Main login page dark visual panel
* Dark modal / splash branding where a horizontal logo is needed
* Dark presentation-style sections

Do not place it directly on a bright white background if the white `Court` lettering loses contrast.

---

### `public/cp1(1).png`
Approximate source size: 2048 × 682.

Purpose:
**Secondary dark-background horizontal CourtPrime wordmark / alternate dark lockup.**

Use on:

* Dark footer
* Dark CTA bands
* Marketing section dividers
* Authentication footer / support branding
* Alternative dark-layout situations where it has better visual balance than `cp3(1).png`

Do not show `cp3(1).png` and `cp1(1).png` next to each other.

They are variants of the same brand family, not separate brands.

---

### `public/cp2(1).png`
Approximate source size: 2048 × 682.

Purpose:
**Primary light-background horizontal CourtPrime wordmark.**

The word `Court` is navy/blue and `Prime` is hot pink.

Use on:

* Light-mode navbar
* Light dashboard header where a full wordmark is appropriate
* White authentication form panel
* Printable/public light sections
* Marketing cards with white/light backgrounds
* Email/public templates when a horizontal colored mark is required

---

### `public/cp.png`
Approximate source size: 1254 × 1254.

Purpose:
**Official square CourtPrime app icon / compact CP mark.**

Use on:

* Favicon
* PWA icon
* App loading screen
* Collapsed admin sidebar
* Mobile header
* Notification avatar/icon where branding is needed
* Empty states
* Login/loading animation
* Compact dashboard branding
* Browser/app launcher
* Public player QR identity screen as a brand mark, not as the QR itself

Do not use the full horizontal wordmark inside tiny icon containers.

Use `cp.png` instead.

---

# COURTPRIME PLAYER / SPORTS VISUAL ASSETS

All model and equipment images are transparent PNG assets and should be treated as real CourtPrime marketing artwork.

Do not regenerate them.

Do not replace their faces, clothing, paddles, colors, or brand marks.

Do not stretch them.

Do not crop through faces, paddles, hands, balls, or shoes unless a deliberate responsive crop is required.

Always preserve aspect ratio.

Use `object-contain` for most compositions.

## `public/cp-model5.png`
Approximate source size: 1122 × 1402.

Contains:
CourtPrime male and female player duo in an energetic action composition.

Primary use:
**Main landing-page hero athlete visual.**

Use it on the right side of the hero or as the dominant visual in a two-column hero.

Also appropriate for:

* Player-network introduction
* Business + player ecosystem section
* Final premium CTA visual

Do not use it behind important text at full opacity.

---

## `public/cp-model4.png`
Approximate source size: 1122 × 1402.

Contains:
CourtPrime male player in ready stance with paddle and ball.

Use for:

* Male player profile / global player identity section
* Rankings section
* Match history section
* Player achievement section
* Desktop decorative athlete cutout beside data cards

---

## `public/cp-model3.png`
Approximate source size: 1122 × 1402.

Contains:
CourtPrime female player in ready stance with paddle and ball.

Use for:

* Player portal section
* Membership/player identity section
* Mobile app showcase
* Player discovery / profile section
* Alternating visual with `cp-model4.png`

---

## `public/cp-model1.png`
Approximate source size: 1122 × 1402.

Contains:
CourtPrime female player in active match movement.

Use for:

* Booking flow section
* Open Play section
* Tournament participation section
* Live-match section
* Scroll-driven sports storytelling section

---

# COURTPRIME EQUIPMENT / DECORATIVE ASSETS

## `public/cp-paddle3.png`
Approximate source size: 1254 × 1254.

Contains:
Hot-pink pickleball with navy/blue/pink motion trails.

Use for:

* Scroll-linked decorative motion element
* Section transition
* Booking-confirmation animation decoration
* Live-score visual accent
* Hero background accent at controlled opacity
* Loading / success artwork

Never let it cover form fields or text.

---

## `public/cp-paddle2.png`
Approximate source size: 1536 × 1024.

Contains:
Two CourtPrime paddles, branded equipment, and balls.

Use primarily for:

* POS & merchandise section
* Equipment rental section
* Inventory section
* Pro-shop / retail features
* Business-owner landing-page feature showcase

---

## `public/cp-paddle4.png`
Approximate source size: 1254 × 1254.

Contains:
Two crossed paddles with a pickleball.

Use for:

* Feature-card artwork
* Open Play
* Tournament module
* Match setup
* Empty states
* Sports-category cards

---

## `public/cp-paddle.png`
Approximate source size: 1254 × 1254.

Contains:
Single CourtPrime paddle with a moving pickleball.

Use for:

* Reservation feature
* Live scoring
* Match section
* Hover/reveal decoration
* Mobile hero secondary artwork
* CTA decorative illustration

---

# ASSET USAGE RULES

1. Do not place every artwork on the same screen.
2. The landing page should feel intentionally art-directed, not crowded.
3. Use one dominant athlete visual per major section.
4. Use equipment artwork as supporting decoration.
5. Maintain generous negative space.
6. Do not overlap text with faces or paddles.
7. Do not cover important controls with decorative assets.
8. On mobile, move decorative art below content or hide nonessential decoration.
9. All transparent artwork must remain crisp against dark and light surfaces.
10. Prevent cumulative layout shift by defining aspect ratio / dimensions.
11. Lazy-load below-the-fold images.
12. Hero image should be preloaded or given high fetch priority when appropriate.
13. Use responsive sizing and never render a 2K source at full intrinsic dimensions when the UI only needs a small display.
14. Optionally create optimized WebP/AVIF derivatives while preserving the original PNG files in `public/`.
15. Do not alter the original PNG source assets.

---

# 3. BRAND / VISUAL DIRECTION


CourtPrime must look like a premium modern sports-technology SaaS platform.

The visual system should combine:

* Premium SaaS
* Pickleball performance branding
* Modern sports network
* Enterprise business software
* High-end booking platform
* Live sports scoring
* Mobile sports app
* Professional operations software

Use colors derived from the supplied CourtPrime artwork.

## Core palette

Use CSS variables / Tailwind theme tokens.

Recommended base tokens:

```css
--cp-deep-navy: #050C20;
--cp-navy: #07132F;
--cp-card-navy: #0B1735;
--cp-blue: #0A4FB8;
--cp-electric-blue: #1269E8;

--cp-pink: #F20B5F;
--cp-hot-pink: #FF176B;
--cp-deep-pink: #C6004D;

--cp-white: #FFFFFF;
--cp-light: #F8FAFC;
--cp-gray-100: #F1F5F9;
--cp-gray-400: #94A3B8;
--cp-gray-700: #334155;
```

Exact rendering can be adjusted slightly to visually match the supplied logo artwork.

Do not scatter raw hex colors throughout components.

Create semantic tokens such as:

```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--secondary
--accent
--muted
--muted-foreground
--border
--success
--warning
--danger
--live
```

## Dark mode

Primary background:
Deep navy / midnight.

Use:

* Navy surfaces
* Slightly lighter card navy
* White headings
* Soft gray secondary text
* Hot-pink CTA
* Electric-blue secondary accents
* Restrained pink/blue glows

Do not make the entire interface neon.

The product must remain usable for long work sessions.

## Light mode

Primary background:
White / very light cool gray.

Use:

* White cards
* Navy headings
* Navy body text
* Hot-pink CTA
* Blue secondary actions
* Soft gray borders
* Controlled shadows

Use `cp2(1).png` as the main light-surface wordmark.

## Contrast

Maintain strong accessibility contrast.

The logo and artwork can be vibrant, but operational UI must stay readable.

## Surface style

Prefer:

* 14–24px border radius depending on component
* Thin cool-gray or translucent borders
* Soft layered shadows
* Subtle background gradients
* Light glass treatment only where appropriate
* High-contrast operational tables
* Spacious layouts
* Clear visual hierarchy

Avoid:

* Excessive glossy shine
* Metallic chrome everywhere
* Constant pulsing neon
* Heavy blur that hurts readability
* Random gradients
* Overlapping content
* Generic admin-template styling

---


# 3A. MARKETING IMAGE COMPOSITION SYSTEM

Create reusable React components for marketing artwork instead of placing raw `<img>` elements inconsistently.

Examples:

* `BrandWordmark`
* `BrandIcon`
* `AthleteArtwork`
* `EquipmentArtwork`
* `FloatingSportAccent`
* `MarketingVisualFrame`

Properties may include:

* variant
* asset
* position
* maxWidth
* priority
* decorative
* reducedMotionBehavior

For decorative images, use empty alt text.

For meaningful product/athlete imagery, provide concise accessible alt text.

Use consistent CSS:

* `pointer-events-none` for purely decorative art
* `select-none`
* `object-contain`
* controlled `max-width`
* absolute positioning only inside explicitly positioned marketing wrappers
* predictable z-index tokens

Never let absolute artwork escape its section and overlap the next section.

Use `overflow-hidden` only when the visual design requires clipping.

Do not clip faces or core equipment unintentionally.

---

# 3B. ADVANCED MOTION DESIGN SYSTEM

The landing page must feel like a premium funded SaaS/sports website.

Use Motion for React / Framer Motion and browser-native observers.

Do not add another animation framework unless the existing project truly needs it.

Implement:

* Hero entrance sequence
* Scroll-triggered section reveals
* Staggered feature cards
* Scroll-linked parallax on athlete/equipment art
* Animated network connection lines
* Sticky product showcase
* Number count-up when KPI cards enter viewport
* Smooth tab/content transitions
* Booking-flow step transitions
* Live-score flip/update animations
* Leaderboard movement animation
* CTA hover microinteractions
* Navbar background transition after scrolling
* Scroll progress indicator where tasteful

Use:

* `useScroll`
* `useTransform`
* `whileInView`
* `viewport={{ once: true }}`
* IntersectionObserver where appropriate

Animations must communicate hierarchy and state.

Do not animate everything continuously.

Use spring/easing values consistently.

Support `prefers-reduced-motion`.

When reduced motion is enabled:

* Remove parallax
* Remove large transforms
* Disable unnecessary continuous motion
* Preserve simple fades/state transitions

---

# 3C. LANDING-PAGE PERFORMANCE RULES

The landing page will use multiple high-resolution transparent PNGs.

Optimize carefully.

Requirements:

* Lazy-load all below-the-fold athlete/equipment images
* Preload only the main logo and hero art when appropriate
* Use `fetchPriority="high"` for the hero visual only if it improves LCP
* Define width/height or aspect ratio
* Avoid layout shifts
* Defer noncritical charts/mock previews
* Pause offscreen animation work
* Do not use expensive continuous JavaScript scroll listeners
* Prefer Motion values / requestAnimationFrame-backed animation
* Keep blur filters restrained
* Do not render hidden 2K images on mobile
* Use responsive source variants if derived assets are created
* Keep the original public PNGs unchanged

The premium motion experience must not make the landing page feel slow.

# 4. DESIGN REQUIREMENTS

The UI must NOT look like a generic CRUD admin template.

Create a professionally designed sports SaaS experience.

Use:

* Large dashboard statistics
* Soft shadows
* Premium cards
* Subtle borders
* Gradient highlights
* Animated counters
* Smooth page transitions
* Skeleton loaders
* Command menus
* Drawer panels
* Slide-over forms
* Interactive calendars
* Status indicators
* Hover micro-interactions
* Context menus
* Tooltips
* Toast notifications
* Loading states
* Empty states
* Error states
* Success animations
* Responsive tables
* Mobile card views
* Filter chips
* Advanced search
* Date range filtering

Use animation purposefully.

Animations must feel smooth and professional, not excessive.

Use Framer Motion for:

* Landing page hero entrance
* Section reveals
* Card hover effects
* Dashboard widgets
* Modal transitions
* Sidebar transitions
* Live score updates
* Booking status changes
* Success states
* Number counters

Respect:

`prefers-reduced-motion`

---

# 5. APPLICATION ARCHITECTURE


Build CourtPrime as a true subscription-based **multi-tenant SaaS plus a shared global player network**.

CourtPrime is not only software installed conceptually for one club.

It is one centralized platform where:

* Many independent pickleball business owners subscribe
* Each owner operates one or more organizations/brands
* Each organization can operate multiple branches
* Each branch can contain multiple courts
* Players create only one CourtPrime account
* The same player can participate across many independent CourtPrime organizations without duplicate accounts
* Business data remains isolated even though player identity is shared at the platform level

Core hierarchy:

Platform
→ Global Users
→ Global Player Profiles
→ Organizations / Companies
→ Branches / Club Locations
→ Courts

Relationship model:

CourtPrime Platform

Global Player:
Juan Santos
CourtPrime Player ID:
`CP-PLY-000001`

Juan can interact with:

Organization A:
Metro Pickle Club
→ Bacolod Branch
→ Court 1
→ Court 2

Organization B:
Prime Pickle Center
→ Dumaguete Branch
→ Court 1
→ Court 2
→ Court 3

Organization C:
Cebu Pickle Arena
→ Cebu Branch
→ Championship Court

Juan remains the same global player in every organization.

Do NOT create a duplicate player record simply because Juan books or plays at another organization.

Use a global `players` / `player_profiles` model and an organization relationship table such as:

`organization_players`

The organization relationship may contain:

* organization_id
* player_id
* local_player_number
* organization_skill_level if used
* home_branch_id if the player chooses a home branch inside that organization
* customer status
* first_visit_at
* last_visit_at
* organization-specific tags
* organization-specific notes with proper privacy
* local preferences
* status

Every tenant-owned operational or financial record must contain the appropriate:

* organization_id
* branch_id when applicable

Examples of tenant-scoped records:

* Reservations
* Memberships
* Organization wallet balances
* POS transactions
* Payments
* Discounts
* Waivers
* CRM notes
* Outstanding balances
* Inventory
* Expenses
* Employees
* Pricing
* Private customer notes

Global player identity is platform-scoped.

Business operations are tenant-scoped.

Never expose one organization's private business information to another organization.

Use Laravel Policies and centralized tenant scoping.

Superadmin can cross tenant boundaries only through explicit platform-level authorization.

---


# 5A. GLOBAL PLAYER IDENTITY

This is a critical architectural requirement.

A player must have only **one CourtPrime identity** across the entire platform.

Example:

Juan Santos registers once.

CourtPrime creates:

`CP-PLY-000001`

Juan then plays at:

* Metro Pickle Club
* Bacolod Pickle Center
* Dumaguete Pickleball Hub
* Cebu Prime Courts
* Future CourtPrime-connected facilities

Do NOT create:

Juan Santos — Organization A
Juan Santos — Organization B
Juan Santos — Organization C

as separate independent player identities.

Instead:

Global Player:
`CP-PLY-000001`

Organization relationships:

`organization_players`

Organization A → Player CP-PLY-000001
Organization B → Player CP-PLY-000001
Organization C → Player CP-PLY-000001

The player owns one login and one platform identity.

The same player account should be usable for:

* Court discovery
* Court booking
* Open play
* Tournament registration
* Match history
* Live scores
* Player ranking
* Achievements
* Club discovery
* Invitations
* Player connections
* Notifications
* Profile management
* QR identity/check-in
* Cross-club activity history

Global player profile should support:

* CourtPrime Player ID
* Profile photo
* Display name
* First name
* Last name
* Email
* Mobile number
* Birthday
* Gender if voluntarily provided
* Home city / region
* Preferred playing hand if provided
* Preferred match type
* Skill level
* Global rating
* Singles rating if supported
* Doubles rating if supported
* Global match count
* Wins
* Losses
* Win percentage
* Tournaments played
* Achievements
* Verified clubs played at
* Privacy settings
* Account verification status
* Player status

Do not put organization-specific membership, wallet, payment or private CRM data directly on the global player profile.

---

# 5B. GLOBAL DATA VS TENANT DATA

CourtPrime must explicitly separate **platform-global player data** from **organization-private business data**.

## Platform-global data

May include:

* CourtPrime Player ID
* Public player profile
* Global rating
* Rating history
* Verified match history
* Global wins/losses
* Tournament results
* Achievements
* Public rankings
* Clubs played at when privacy settings allow
* Public sports statistics
* Public match results
* Player connections/follows if implemented

## Tenant-private data

Must remain isolated per organization:

* Membership
* Organization wallet
* Reservation financial details
* Payment history
* POS purchase history
* Discounts
* Credit limits
* Outstanding balances
* Waivers
* CRM notes
* Private staff notes
* Customer tags
* Internal risk flags
* Contact logs
* Refund history
* Organization-specific promotions
* Sensitive operational data

Organization A must never be able to retrieve Organization B's private tenant data.

A club viewing a global player may see:

* CourtPrime Player ID
* Public profile
* Global rating
* Public/verified statistics
* Organization A's own relationship with that player

It must not see Organization B's:

* Membership
* Wallet
* Purchases
* Payments
* Internal notes
* Discounts
* Outstanding balance
* Private reservation data

unless the player explicitly shared information through a feature designed for that purpose.

---

# 5C. PLAYER IDENTITY RESOLUTION & DUPLICATE PREVENTION

Prevent duplicate global player identities.

Support account matching using verified identifiers such as:

* Email
* Mobile number
* Existing CourtPrime Player ID
* Secure QR identity token

When a front desk creates a walk-in player:

1. Search the global CourtPrime directory first.
2. If a matching player exists, link that player to the organization using `organization_players`.
3. If no player exists, create an organization-side provisional player identity or invite flow.
4. Allow the player to claim/verify the provisional profile later.
5. Merge only through controlled, auditable workflows.
6. Never silently merge two people only because their names match.

Create duplicate review tooling for Superadmin where appropriate.

Maintain merge audit history.

---

# 6. PLATFORM SUPERADMIN

Create a platform-level EAJ Superadmin dashboard.

EAJ Superadmin can manage:

* All subscribed organizations
* Organizations
* Owners
* Branches
* Courts
* Subscription packages
* Subscription status
* Trials
* Demo applications
* Payments
* Billing
* Feature availability
* User counts
* Court counts
* Storage usage
* Subscription revenue
* Trial conversions
* Churn
* Active subscriptions
* Suspended tenants
* Expired subscriptions
* System announcements
* Support tickets
* Platform configuration
* Audit logs
* Email templates
* Notification templates
* Maintenance mode

Superadmin dashboard metrics:

* Total organizations
* Active subscriptions
* Trial organizations
* MRR
* ARR
* Expiring subscriptions
* Total branches
* Total courts
* Total registered players
* Reservations today
* Platform GMV if applicable
* Demo leads
* New tenants
* Failed payments

Include charts for:

* Revenue
* Subscription growth
* Reservations
* New organizations
* Player growth
* Churn
* Trial conversion

---


# 6A. NETWORK SUPERADMIN METRICS

In addition to SaaS subscription metrics, EAJ Superadmin should have platform network analytics.

Metrics:

* Total global players
* Verified global players
* New players
* Active players
* Connected organizations
* Connected branches
* Connected courts
* Cross-organization bookings
* Players active at 2+ organizations
* Global matches
* Rating-eligible matches
* Live matches
* Tournament registrations
* Open play joins
* Court discovery searches
* Booking conversion rate
* Most active cities
* Most active organizations
* Network growth

Important:

Network analytics may aggregate platform activity.

Do not expose one tenant's private financial or operational details to another tenant.

---

# 7. SUBSCRIPTION SaaS MODULE

Build a complete subscription management system.

Subscription plans should be configurable by Superadmin.

Example plans:

## STARTER

Suitable for a small single-location facility.

Includes configurable limits such as:

* 1 branch
* Up to 4 courts
* Reservations
* Basic POS
* Players
* Staff
* Basic reporting

## PROFESSIONAL

Includes:

* Multiple branches
* More courts
* Memberships
* Open Play
* Tournaments
* Live Scoring
* Inventory
* Advanced analytics

## ENTERPRISE

Includes:

* Unlimited or custom branches
* Unlimited/custom courts
* Advanced permissions
* API access
* Custom domain
* White-label options
* Advanced reporting
* Priority support

Do not hardcode these limits.

Create feature flags and plan limit tables.

Features should be configurable per plan.

Create:

* subscription_plans
* subscription_plan_features
* subscriptions
* subscription_payments
* subscription_invoices
* subscription_events
* feature_overrides

Support:

* Free trial
* Monthly plans
* Quarterly plans
* Annual plans
* Coupon codes
* Promotional discounts
* Manual subscriptions
* Manual payment confirmation
* Subscription renewal
* Upgrade
* Downgrade
* Cancellation
* Grace period
* Expiration
* Suspension
* Reactivation

---

# 8. LANDING PAGE


Create a completely redesigned premium public landing page at:

`/`

The landing page must clearly serve both:

1. Players
2. Pickleball businesses / court owners

It should communicate the centralized CourtPrime concept:

**One Player Identity. Many Independent Clubs. One Connected Pickleball Network.**

At the same time, it must communicate that each court owner receives a complete private business operating system.

## Navbar

Desktop:

* Dark/transparent at top of dark hero
* Use `cp3(1).png`
* Transition to glass/blur navy surface after scroll
* On light section layouts, a light navbar state may use `cp2(1).png`

Navigation:

* Find Courts
* Play
* Live
* Rankings
* Tournaments
* For Clubs
* Features
* Pricing
* Request Demo
* Sign In

Primary CTA for players:

**Find a Court**

Primary CTA for businesses:

**Request a Demo**

Do not create separate public login buttons for player/admin/owner/cashier.

Use one:

**Sign In**

All roles authenticate through the same `/login` route.

## Landing-page scroll logic

Implement a premium scroll story.

As the user scrolls:

1. Hero athlete art enters with controlled depth/parallax.
2. The player-network diagram reveals connecting one global player to multiple clubs.
3. Global profile cards animate into view.
4. Connected club cards reveal in staggered motion.
5. Booking steps advance visually.
6. Live-score cards animate with realistic score-state transitions.
7. Rankings section animates leaderboard position indicators.
8. Business-OS section transitions from player experience into owner operations.
9. Product dashboard mockups switch based on scroll position.
10. Final CTA enters with subtle equipment motion.

Do not make users fight horizontal scroll.

Any pinned/sticky storytelling must remain usable on mobile and must have a normal stacked fallback.

## Page quality

The page must feel:

* Premium
* Fast
* Professional
* Sports-focused
* Modern
* Connected
* Enterprise-ready
* Mobile-first for players
* Trustworthy for business owners

Avoid giant empty sections.

Avoid generic SaaS template copy/layout.

Use actual CourtPrime artwork from `public/`.

---

# 9. LANDING PAGE HERO


Create a high-impact but clean hero.

Recommended composition:

Left:
Marketing copy and CTAs.

Right:
`/cp-model5.png`

Top-left navbar:
`/cp3(1).png`

Optional subtle background decorative accent:
`/cp-paddle3.png`

Do not place the paddle/ball artwork directly behind the copy at high opacity.

## Hero headline

# One Player Profile. Every Connected Court.

Supporting line:

**Discover clubs, book courts, join open play, enter tournaments, follow live scoring and build one verified pickleball record from a single CourtPrime account.**

Secondary business line:

**For court owners, CourtPrime runs reservations, branches, POS, memberships, tournaments, staff, inventory and analytics from one private business workspace.**

Player CTA:

**Find a Court**

Secondary player CTA:

**Create Player Account**

Business CTA:

**Request a Live Demo**

Trust statement:

**Shared player identity. Private business operations.**

## Hero visual cards

Around the athlete art, use small floating UI cards such as:

* `CP-PLY-000001`
* Global Rating `4.21`
* Next Booking `7:30 PM`
* Live Match `11–9`
* Connected Clubs `4`
* Global Rank `#128`

Keep card count controlled.

On mobile:

* Text first
* CTA group second
* Athlete art third
* Floating cards simplified or reduced

## Hero animation

On initial load:

1. Wordmark/navigation fades in.
2. Headline reveals in 2–3 short staggered lines.
3. CTAs enter.
4. Athlete art rises/fades with slight scale.
5. Profile/rating cards settle around the art.

When scrolling:

* Athlete art moves slightly slower than page content
* Decorative ball may travel a restrained curved path
* UI cards drift by only a few pixels
* Background network points become visible

No exaggerated spinning or glowing.

---

# 10. LANDING PAGE SECTIONS


Create the following landing-page sections with intentional use of the supplied artwork.

## 1. One Player Identity Across the Network

Goal:
Explain the core differentiator immediately after the hero.

Visual:

* Use `/cp-model4.png` on one side.
* Use a global CourtPrime player profile mockup on the other side.

Show:

* CourtPrime Player ID
* Global rating
* Matches
* Wins
* Achievements
* Connected clubs

Animate club nodes around a single player identity.

Copy:

**Register once. Play across every participating CourtPrime facility without creating duplicate player accounts.**

---

## 2. Discover Connected Clubs

Show a premium court/facility finder.

Cards:

* Club
* Branch
* Location
* Courts
* Indoor / Outdoor
* Next available slot
* Open Play badge
* Tournament badge
* Starting public rate
* Book button

Filters:

* Location
* Date
* Time
* Indoor / outdoor
* Amenities
* Price
* Open Play
* Tournament
* Coaching
* Available now

Decorative art:
Use `/cp-paddle.png` sparingly.

---

## 3. Book From One Account

Use `/cp-model1.png` as the athlete visual.

Show animated booking sequence:

1. Find club
2. Select branch
3. Select court
4. Select date/time
5. Add players
6. Add rentals
7. Apply that club's membership benefits
8. Pay
9. Confirm

Use a sticky booking mockup on desktop.

As the section scrolls, update the active step.

Do not actually trigger payment in marketing preview.

---

## 4. Your Record Goes With You

Use `/cp-model3.png`.

Show match-history cards from multiple independent clubs.

Example layout:

Metro Pickle Club
WIN
11–8, 11–9

Prime Pickle Center
WIN
8–11, 11–7, 11–6

Cebu Pickle Arena
LOSS
9–11, 7–11

Show:

* Host organization
* Branch
* Opponents
* Partner
* Score
* Result
* Rating impact
* Verified badge

Animate cards upward in chronological timeline order.

---

## 5. Global & Local Rankings

Use `/cp-model4.png` or a cropped/positioned version if it is not already visible nearby.

Show tabs:

* Global
* Organization
* Branch
* City
* Province
* Region

Filters:

* Singles
* Doubles
* Mixed
* Skill bracket
* Age division
* Period

Animate rank movement only when values change or when demo content enters view.

---

## 6. Live Across CourtPrime

Show live-score tiles from multiple participating clubs.

Use `/cp-paddle3.png` as a controlled motion accent.

Show:

* Organization
* Branch
* Court
* Players
* Current score
* Game
* Tournament round if applicable
* LIVE status

Use score flip/update animation.

---

## 7. Open Play & Tournaments

Use `/cp-paddle4.png`.

Create two premium columns/tabs:

Open Play:
* Club
* Skill range
* Date/time
* Slots
* Waitlist
* Fee

Tournaments:
* Host
* Venue
* Registration status
* Division
* Entry fee
* Bracket/live status

---

## 8. For Court Owners — Run the Entire Business

This section transitions the story from player network to business SaaS.

Use a dark premium background.

Use `cp3(1).png` or `cp1(1).png` as branding, but not both.

Show business modules:

* Multi-branch
* Courts
* Reservations
* Live operations
* POS
* Memberships
* Open Play
* Tournaments
* Live scoring
* Inventory
* Staff
* Finance
* CRM
* Reports
* Analytics

CTA:

**Request a Live Demo**

---

## 9. POS, Equipment & Inventory

Use `/cp-paddle2.png`.

Show premium POS mockup.

Products/services:

* Court fees
* Paddle rental
* Paddle sale
* Pickleballs
* Drinks
* Merchandise
* Coaching
* Memberships
* Tournament fees

Animate product cards subtly.

Do not use the artwork as a literal product thumbnail for every item.

---

## 10. Business Analytics

Show:

* Revenue trend
* Reservations
* Court utilization
* Peak hours
* Player retention
* Membership growth
* Branch comparison

Use real-looking seeded preview data.

Do not expose another organization's analytics.

---

## 11. Role-Based Platform Experience

Show four persona cards:

* CourtPrime Platform Admin
* Court Owner / Organization Owner
* Staff / Cashier
* Player

All cards point to the same authentication route:

`/login`

Explain:

**One secure sign-in. The right workspace automatically opens based on your account and permissions.**

---

## 12. Final CTA

Dark premium final section.

Use:

* `/cp-model5.png` OR `/cp-paddle3.png` depending on available space
* `/cp1(1).png` for dark footer/CTA branding

Player CTA:

**Find Your Next Court**

Business CTA:

**Bring Your Club to CourtPrime**

Keep artwork from overlapping footer links.

---

# 11. LIVE DEMO APPLICATION FORM

Create route:

`/request-demo`

Create a premium multi-step form.

Step 1:

Business Information

* Business / Club Name
* Owner / Contact Person
* Email
* Mobile Number
* Website
* Facebook Page

Step 2:

Business Operation

* Number of Branches
* Number of Courts
* Estimated Members
* Estimated Monthly Reservations
* Existing Management Software
* Current Pain Points

Step 3:

Features Needed

Checkboxes:

* Court Reservation
* POS
* Inventory
* Membership
* Tournament
* Open Play
* Live Scoring
* Player Ranking
* Staff Management
* Financial Reports
* Mobile Player Portal
* Digital Display
* API Integration
* Other

Step 4:

Demo Preference

* Online Demo
* On-Site Meeting
* Google Meet
* Zoom
* Other

Fields:

* Preferred date
* Preferred time
* Notes

Step 5:

Submit

After submission:

Display a premium confirmation screen.

Generate lead reference:

`DEMO-2026-000001`

Store every request in:

`demo_requests`

Superadmin should be able to:

* View
* Filter
* Assign sales representative
* Add notes
* Schedule demo
* Change status
* Contact lead
* Convert lead into tenant

Statuses:

* New
* Contacted
* Demo Scheduled
* Demo Completed
* Proposal Sent
* Negotiation
* Converted
* Lost

---

# 12. TENANT ONBOARDING

Once an organization subscribes, create an onboarding wizard.

Steps:

1. Organization information
2. Business logo
3. Branch setup
4. Court creation
5. Business operating hours
6. Pricing configuration
7. Tax configuration
8. Reservation rules
9. Add staff
10. Add membership plans
11. POS configuration
12. Payment configuration
13. Notification setup
14. Go Live

Show onboarding percentage.

Example:

`72% Setup Complete`

---


# 12A. ONE LOGIN PAGE FOR EVERY USER

CourtPrime must have **one primary login page** for all authenticated user types.

Route:

`/login`

Do not create separate login pages such as:

* `/admin/login`
* `/owner/login`
* `/cashier/login`
* `/player/login`

unless a future SSO/integration explicitly requires a separate technical callback.

The visible CourtPrime sign-in experience must remain unified.

## Users who use the same login page

* EAJ / CourtPrime Platform Superadmin
* Court Owner / Organization Owner
* General Manager
* Branch Manager
* Front Desk
* Cashier
* Court Staff
* Referee / Scorekeeper
* Coach
* Tournament Director
* Inventory Staff
* Accounting
* Player / Member

## Login page visual design

Create a premium responsive split-screen authentication experience.

Desktop:

Left visual panel:

* Deep navy background
* `cp3(1).png` horizontal wordmark
* `/cp-model5.png` or `/cp-model4.png`
* Subtle network graphics
* Small value statement:
  **One Player Identity. Every Connected Court.**

Right form panel:

* White/light card or clean light surface
* `cp2(1).png` may be used in compact form when appropriate
* Email / username
* Password
* Remember me
* Forgot password
* Sign in
* Create player account
* Business demo link

Mobile:

* Use compact `cp.png` or `cp2(1).png`
* Hide heavy decorative art
* Keep form immediately visible
* Preserve fast loading

Do not ask the user to choose "Player", "Owner", "Cashier" before login merely to decide authentication.

Authenticate identity first.

Resolve role/workspace after authentication.

---

# 12B. POST-LOGIN WORKSPACE RESOLVER

After successful authentication, resolve what workspaces the user is authorized to access.

Possible contexts:

* Platform
* Organization
* Player

Examples:

## EAJ Platform Superadmin only

Redirect:

`/superadmin/dashboard`

## Organization Owner only

Redirect:

`/app/dashboard`

with their default organization context.

## Cashier only

Redirect:

`/pos`

or the configured branch cashier home.

## Staff / Front Desk only

Redirect:

`/operations`

or role-configured branch workspace.

## Player only

Redirect:

`/me`

## User with multiple contexts

Example:
A court owner may also be a pickleball player.

Do not require a second account.

After login, if multiple workspaces are available, redirect to:

`/choose-workspace`

Example options:

* Player — Juan Santos
* Owner — Metro Pickle Club
* Manager — Cebu Branch
* Platform Admin — EAJ CourtPrime

Allow:

* Remember last workspace
* Switch workspace from the authenticated top bar
* Preserve security boundaries on every switch

Store active workspace context in a controlled server-side/session mechanism.

Never trust a raw organization ID supplied by the browser without authorization.

---

# 12C. ACCOUNT / ROLE DATA MODEL

Prefer one canonical `users` identity table.

A user may optionally have:

* One global player profile
* Platform-level role(s)
* Organization role(s)
* Branch restrictions
* Multiple organization memberships if authorized

Recommended concepts:

* `users`
* `player_profiles`
* `platform_user_roles`
* `organization_users`
* `organization_user_roles`
* `roles`
* `permissions`

Do not duplicate a person into separate authentication tables simply because they are both a player and an employee/owner.

Identity should remain unified.

Authorization context determines what they can see and do.

---

# 12D. AUTHENTICATION SECURITY

Requirements:

* Laravel authentication/session security
* CSRF protection
* Rate limiting
* Email verification where required
* Password reset
* Optional MFA architecture
* Session/device management
* Login audit events
* Failed-login protections
* Secure remember-me handling
* Server-side role/workspace authorization

Do not expose the existence of privileged roles through insecure login errors.

Generic authentication errors are preferred.

---

# 13. USER ROLES


Create comprehensive role and permission management.

Do not depend only on role names.

Every protected action must use granular permissions.

## EAJ / CourtPrime Platform Superadmin

Platform-level unrestricted administrative access.

This is the dashboard for the owner/operator of the CourtPrime SaaS platform.

Default home:

`/superadmin/dashboard`

Can manage:

* Organizations
* Subscriptions
* Plans
* Billing
* Global players
* Network metrics
* Demo leads
* Support
* Platform configuration
* Global audit
* Feature flags
* Tenant suspension/reactivation
* Network health

---

## Organization Owner / Court Owner

Full control of their subscribed organization only.

Default home:

`/app/dashboard`

Can view:

* Entire organization
* All authorized branches
* Revenue
* Reservations
* Occupancy
* Staff
* POS
* Inventory
* Membership
* Tournaments
* Reports
* Analytics

Cannot access another organization's private data.

---

## General Manager

Can manage authorized branches.

Default home:

`/app/dashboard`

Show operational + management metrics.

---

## Branch Manager

Controls assigned branch.

Default home:

`/operations`

Show:

* Today's reservations
* Courts
* Check-ins
* Open Play
* Staff
* Pending payments
* Maintenance
* Branch sales summary

---

## Front Desk

Default home:

`/operations`

Can:

* Create reservations
* Check players in
* Manage walk-ins
* Search/link global CourtPrime players
* Accept permitted payments
* View current courts
* Manage Open Play queue

---

## Cashier

Default home:

`/pos`

POS-first experience.

Can:

* Open cashier session
* Process sales
* Accept payments
* Apply permitted discounts
* Print/email receipts
* Perform permitted refunds/voids
* View own/register reconciliation

Do not overload cashier UI with executive analytics.

---

## Court Staff

Default home:

`/live-courts`

Can manage:

* Court status
* Operational assignments
* Maintenance status
* Match readiness

---

## Referee / Scorekeeper

Default home:

Assigned match / scoring interface.

Can:

* Control live scores
* Undo with permission
* Correct score
* End game
* End match
* Add notes

---

## Coach

Default home:

`/coach/dashboard`

Can:

* View coaching schedule
* View assigned players
* Manage lessons
* View permitted player sports information

---

## Tournament Director

Default home:

Tournament command center.

Can:

* Manage tournament
* Registration
* Courts
* Match queue
* Brackets
* Live match assignment

---

## Inventory Staff

Default home:

Inventory dashboard.

Can:

* Products
* Receiving
* Adjustments
* Transfers
* Stock counts
* Alerts

---

## Accounting

Default home:

Finance dashboard.

Can:

* Financial reports
* Invoices
* Payments
* Expenses
* Reconciliation
* Export

---

## Player / Member

Default home:

`/me`

Customer-facing global CourtPrime player dashboard.

Can:

* Find clubs
* Book courts
* Join Open Play
* Register for tournaments
* View live scores
* View rankings
* View global match history
* View organization memberships
* View organization wallets separately
* Manage profile/privacy
* Use QR identity

---

Examples of granular permissions:

* reservations.view
* reservations.create
* reservations.update
* reservations.cancel
* pos.access
* pos.refund
* pos.void
* courts.manage
* courts.status
* tournaments.manage
* scoring.manage
* reports.financial
* users.manage
* branches.manage
* inventory.manage
* memberships.manage
* players.lookup
* players.private_fields
* platform.tenants.manage
* platform.players.manage

---

# 13A. BUSINESS OWNER ACCESS TO GLOBAL PLAYERS

Organization users may interact with global players only through approved business workflows.

Examples:

* Search player for reservation
* Search player for POS
* Check in player
* Add player to tournament
* Add player to open play
* View player public/authorized sports profile

Organization users must not receive unrestricted access to the entire global player database.

Global lookup should return only fields allowed by:

* Player privacy
* Platform policy
* Organization relationship
* User permission

Private tenant data remains scoped to the organization.

---


# 13B. UNIQUE DASHBOARD EXPERIENCE BY PERSONA

Every authenticated user uses the same authentication system, but their home experience must be intentionally different.

Do not render one generic dashboard and merely hide a few cards.

Create role/persona-appropriate dashboard compositions.

## Platform Superadmin dashboard

Design language:
Enterprise SaaS network command center.

Primary metrics:

* Active organizations
* Trial organizations
* MRR
* ARR
* Global players
* New players
* Connected branches
* Connected courts
* Reservations today
* Cross-organization bookings
* Global live matches
* Demo requests
* Failed subscription payments
* Support tickets

Sections:

* Subscription growth
* Network growth
* Player growth
* Revenue
* Trial conversion
* Churn
* Platform alerts
* Tenant status
* Recent privileged activity

---

## Court Owner / Organization Owner dashboard

Design language:
Executive business cockpit.

Primary metrics:

* Revenue today
* Reservations today
* Court occupancy
* Active courts
* Players checked in
* POS sales
* Membership revenue
* Outstanding balances

Sections:

* Branch comparison
* Revenue chart
* Court utilization
* Peak hours
* Reservation trends
* Staff activity
* Inventory alerts
* Membership growth
* Tournament performance

Global network information should only show public/allowed context.

---

## Staff / Front Desk dashboard

Design language:
Operational command center.

Primary focus:

* What is happening now
* What is next
* What needs action

Sections:

* Courts right now
* Next 2 hours reservations
* Check-in queue
* Walk-ins
* Open Play queue
* Pending payments
* Court issues
* Player lookup
* Quick reservation

Large touch-friendly controls.

---

## Cashier dashboard

Design language:
Fast POS workstation.

Primary focus:

* Register state
* Current shift
* Quick sale
* Customer/player lookup
* Pending reservation payments

Show:

* Open register
* Shift sales
* Cash expected
* Payment breakdown
* Recent transactions
* Refund/void requests
* Low-stock POS items

The main CTA should open or remain inside POS.

---

## Player dashboard

Design language:
Premium sports mobile app.

Primary focus:

* Global identity
* Next game
* Find court
* Rating
* Rank
* Recent results
* Events

Show:

* CourtPrime Player ID
* Global rating
* Global rank
* Next reservation
* Connected clubs
* Upcoming Open Play
* Upcoming tournaments
* Latest verified results
* Achievements

Use player-focused sports visuals.

Do not show business admin navigation.

---

# 13C. WORKSPACE SWITCHER

Users with more than one valid context can switch workspaces.

Example:

Juan Santos is:

* Player
* Owner of Metro Pickle Club

Top-bar workspace switcher:

`Player — Juan Santos`
`Metro Pickle Club — Owner`

Switching workspace must:

* Revalidate authorization server-side
* Change route/navigation
* Change active organization context
* Clear inappropriate cached tenant data
* Preserve safe user preferences
* Never leak data between contexts

Do not show the workspace switcher when the user has only one context.

---

# 14. EXECUTIVE DASHBOARD

Create an advanced main tenant dashboard.

Header:

Good morning, [Name]

Display:

* Organization
* Selected branch
* Date selector
* Quick actions

Primary cards:

* Revenue Today
* Reservations Today
* Active Courts
* Court Occupancy
* Players Checked In
* Open Play Players
* POS Sales
* Outstanding Balances

Graphs:

* Revenue trend
* Reservation trend
* Court utilization
* Peak booking hours

Live section:

## Courts Right Now

Court cards:

Court 1
MATCH IN PROGRESS
Team Santos vs Team Cruz
8 - 6

Court 2
AVAILABLE

Court 3
OPEN PLAY
4 Players

Court 4
RESERVED
Starts 7:30 PM

Each status should have a distinct visual treatment.

---

# 15. MULTI-BRANCH MODULE

Create:

`/branches`

Branch fields:

* Branch name
* Branch code
* Address
* GPS location
* Contact
* Email
* Operating hours
* Manager
* Number of courts
* Status
* Timezone
* Currency
* Tax configuration

Organization Owners can switch between:

* All Branches
* Individual branch

Add a global branch selector in the top navigation.

Persist selected branch.

Reports should support:

* Current branch
* Selected branches
* Entire organization

---

# 16. COURT MANAGEMENT

Create:

`/courts`

Court information:

* Court name
* Court number
* Branch
* Court type
* Indoor / Outdoor
* Surface type
* Capacity
* Standard hourly rate
* Peak rate
* Off-peak rate
* Member rate
* Guest rate
* Amenities
* Photo
* Status

Statuses:

* Available
* Reserved
* Occupied
* Open Play
* Tournament
* Coaching
* Maintenance
* Closed

Court detail screen should show:

* Current booking
* Today's schedule
* Upcoming bookings
* Revenue
* Utilization
* Maintenance history
* Match history

---

# 17. COURT SCHEDULER

Build an advanced scheduler comparable to professional booking applications.

Views:

* Timeline
* Day
* Week
* Court view

Columns:

Court 1
Court 2
Court 3
Court 4

Rows:

Time intervals.

Bookings appear as colored blocks.

Support:

* Drag-and-drop reservations
* Resize booking time
* Click empty slot to book
* Conflict detection
* Quick booking
* Filters
* Multiple branches
* Date navigation
* Court type filtering
* Booking source

Do not allow overlapping reservations unless business configuration permits it.

---

# 18. RESERVATION ENGINE

Create a complete booking engine.

Reservation fields:

* Booking reference
* Player/customer
* Branch
* Court
* Date
* Start time
* End time
* Duration
* Number of players
* Reservation type
* Pricing rate
* Discount
* Tax
* Deposit
* Amount due
* Payment status
* Booking status
* Notes
* Source

Reservation statuses:

* Pending
* Confirmed
* Checked In
* Playing
* Completed
* Cancelled
* No Show

Payment statuses:

* Unpaid
* Partial
* Paid
* Refunded

Sources:

* Admin
* Front Desk
* Online
* Player Portal
* Walk-In

Generate references such as:

`RSV-BAC-20260815-0012`

---

# 19. ADVANCED RESERVATION RULES

Admin can configure:

* Opening time
* Closing time
* Minimum booking duration
* Maximum booking duration
* Booking interval
* Advance booking period
* Member priority period
* Maximum reservations per player
* Cancellation period
* Cancellation fee
* No-show fee
* Required deposit
* Peak rates
* Weekend rates
* Holiday rates
* Member rates
* Guest rates

Pricing must be calculated server-side.

Never trust pricing submitted by the browser.

---

# 20. ONLINE PLAYER BOOKING


Build a mobile-first **cross-organization booking experience**.

A signed-in player should not need separate accounts for separate clubs.

Player flow:

1. Choose location or use saved location
2. Browse connected organizations/clubs
3. Select organization
4. Select branch
5. Select date
6. View available courts
7. Select court
8. Select time
9. Select duration
10. Add players
11. Apply that organization's membership rate if the player has an active membership there
12. Add rentals
13. Pay using payment methods allowed by that organization
14. Confirmation

Show visually attractive court cards.

Availability states:

* Available
* Limited Availability
* Booked
* Maintenance
* Event Blocked

Allow:

* Cancel booking subject to organization rules
* Reschedule subject to organization rules
* Invite CourtPrime players
* Invite non-CourtPrime guests
* Share reservation
* Add booking to calendar
* View facility rules
* View branch directions
* View organization cancellation policy

Every booking remains owned by the organization receiving the booking.

The player's unified portal may display all bookings across organizations.

The player portal must not mix organization-specific financial balances.

Example:

Upcoming Bookings

Metro Pickle Club
Bacolod Branch
Court 2
Aug 18 • 7:00 PM

Prime Pickle Center
Dumaguete Branch
Court 1
Aug 21 • 6:00 PM

The player sees both.

Metro Pickle Club staff only sees the Metro Pickle Club reservation.

Prime Pickle Center staff only sees the Prime Pickle Center reservation.

---

# 21. OPEN PLAY MANAGEMENT

Create an enterprise Open Play module.

Allow clubs to create sessions such as:

Saturday Social Open Play

7:00 PM – 10:00 PM

Maximum Players: 32

Skill Range:

2.5 – 4.0

Entry Fee:

₱200

Players can:

* Join
* Pay
* Join waitlist
* Withdraw

Staff dashboard shows:

* Registered
* Checked In
* Playing
* Waiting
* Finished

---

# 22. OPEN PLAY QUEUE

Create smart queue management.

Display:

Waiting Players

1. Juan Santos — 3.5
2. Maria Cruz — 3.7
3. Carlo Reyes — 3.4
4. Anne Lim — 3.6

System can recommend balanced groups.

Support:

* Manual grouping
* Skill-based grouping
* Random grouping
* Winner stays
* Round-robin rotation
* Queue priority

---

# 23. LIVE COURT MANAGEMENT

Create:

`/live-courts`

Show all courts as large live status cards.

Each card contains:

* Court
* Branch
* Current activity
* Players
* Start time
* Duration
* Score
* Next booking

Example:

COURT 04

LIVE MATCH

SANTOS / CRUZ

8

vs

REYES / LIM

6

GAME 2

Elapsed: 12:45

Add live WebSocket updates.

No manual browser refreshing.

---

# 24. LIVE SCORING

Build complete pickleball live scoring.

Support:

* Singles
* Doubles

Formats:

* First to 11
* First to 15
* First to 21
* Win by 2
* Best of 3
* Best of 5
* Rally scoring if configured

Scorekeeper interface must have large touch-friendly controls.

Functions:

* Increase score
* Undo
* Change server
* Change side
* Timeout
* End game
* End match
* Correction
* Match notes

Store every score event.

Create:

`score_events`

This allows reconstruction and audit of a match.

---

# 25. CONSOLIDATED LIVE DISPLAY

This is one of the system's key premium features.

Create route:

`/display/live`

Designed for:

* Large TV
* LED display
* Club lobby
* Projector

Full-screen mode.

No sidebar.

No admin controls.

Display multiple courts simultaneously.

Example:

EAJ PICKLEBALL CLUB

LIVE COURTS

COURT 1
SANTOS / CRUZ
10
vs
8
REYES / LIM

COURT 2
AVAILABLE
NEXT BOOKING 8:00 PM

COURT 3
OPEN PLAY
GAME IN PROGRESS

COURT 4
TOURNAMENT
SEMI FINAL

Bottom ticker:

Upcoming Matches • Tournament Results • Announcements

Auto-update using WebSockets.

Support:

* Light display mode
* Dark arena mode
* Full-screen
* Automatic cycling
* Branch filtering
* Court filtering

---


# 25A. COURTPRIME NETWORK DISCOVERY

Create public/player-facing discovery routes such as:

`/play`

`/clubs`

`/courts/search`

Allow players to search across participating organizations.

Search inputs:

* Location
* Date
* Start time
* Duration
* Number of players

Optional filters:

* Indoor / outdoor
* Amenities
* Court surface
* Price range
* Open play
* Coaching
* Tournament
* Available now

Search results should return only organizations/branches/courts that are published and available for public discovery.

Never expose private tenant configuration or internal data.

---

# 25B. CROSS-ORGANIZATION BOOKING AGGREGATION

CourtPrime should act as the player-facing booking layer while preserving organization ownership of each reservation.

The platform may aggregate public availability from multiple organizations.

When a player selects a court:

1. Resolve organization
2. Resolve branch
3. Resolve court
4. Apply that organization's booking rules
5. Apply that organization's pricing
6. Apply that organization's membership benefits if player is a member
7. Apply that organization's payment configuration
8. Create reservation under that organization
9. Add reservation to the player's unified booking timeline

Do not calculate one universal price for all organizations.

Each organization controls:

* Rates
* Taxes
* Deposits
* Cancellation rules
* Booking windows
* Discounts
* Membership benefits
* Payment methods

---

# 25C. GLOBAL MATCH VERIFICATION

Global player statistics should be based on trustworthy records.

Every match should have verification metadata.

Possible verification levels:

* Official Tournament
* Organization Verified
* Authorized Scorekeeper
* Open Play Verified
* Player Confirmed
* Unverified

Allow rating rules to specify which verification levels affect global rating.

Store:

* verification_status
* verified_by
* verified_at
* rating_eligible
* rating_processed_at
* dispute_status

Support controlled score correction and dispute handling.

All changes must be auditable.

---

# 25D. GLOBAL PLAYER PRIVACY

Global player identity does not mean every field is public.

Create player privacy settings.

Possible visibility options:

* Public
* CourtPrime players only
* Connected organizations only
* Private

Configurable fields may include:

* Profile photo
* Display name
* Rating
* Match history
* Clubs played at
* Achievements
* City
* Upcoming public events

Private personal data such as email, mobile number and emergency contact must not become publicly visible by default.

Organizations may access contact details only when authorized through their legitimate customer relationship and applicable permissions.

---

# 26. PLAYER MANAGEMENT


Create:

`/players`

For organization users, this page represents players connected to their organization.

Do not treat the organization's player list as the canonical platform player table.

Use:

Global player identity
+
Organization-player relationship

## Global player profile

Fields may include:

* CourtPrime Player ID
* Profile photo
* First name
* Last name
* Display name
* Gender if voluntarily provided
* Birthday
* Mobile
* Email
* City / region
* Skill level
* Global rating
* Global total games
* Global wins
* Global losses
* Global win percentage
* Global tournament history
* Achievements
* Privacy settings
* Verification status
* Player status

Generate player IDs such as:

`CP-PLY-000001`

## Organization relationship

Store separately:

* organization_id
* player_id
* local customer/member number
* home branch for that organization if applicable
* organization-specific skill classification
* organization-specific tags
* first visit
* last visit
* local status
* internal notes
* organization-specific preferences

## Organization-owned player data

Remain tenant-scoped:

* Membership
* Wallet balance
* Reservations
* Payments
* Purchases
* Waivers
* Outstanding balances
* CRM notes
* Discounts

When staff search for a player:

1. Search their organization's existing player relationships.
2. Allow global CourtPrime player lookup where permissions and privacy allow.
3. Link existing global player instead of creating duplicates.
4. Create/invite a new global player only when necessary.

Never expose another organization's private customer relationship data.

---

# 27. PLAYER PORTAL


Create a highly polished centralized customer/player portal.

Mobile-first.

This portal belongs to the global CourtPrime player, not to one specific organization.

Navigation:

* Home
* Find Courts
* Bookings
* Open Play
* Matches
* Rankings
* Tournaments
* Live
* Memberships
* Wallets
* QR ID
* Notifications
* Profile

Player dashboard:

Welcome back, Juan

Show:

* CourtPrime Player ID
* Global rating
* Global rank
* Matches played
* Wins
* Win percentage
* Next reservation
* Next tournament
* Upcoming open play
* Recent results
* Achievements
* Connected clubs

Quick actions:

* Find Court
* Book Court
* Join Open Play
* Find Tournament
* View Live Matches
* Show QR ID

## Unified Bookings

Show bookings from every organization the player uses.

## Memberships

Display organization-specific memberships separately.

Example:

Metro Pickle Club
Professional Membership
Active until Dec 31

Prime Pickle Center
No active membership

Do not represent these as one global membership.

## Wallets

If organization wallets are used, display them separately.

Example:

Metro Pickle Club Wallet
₱500

Prime Pickle Center Wallet
₱0

Do not combine tenant wallets into a global spendable balance unless a future platform-level wallet is intentionally implemented with its own accounting architecture.

## Match History

Show verified match history across participating organizations.

## Privacy Controls

Players should be able to configure:

* Public profile visibility
* Match history visibility
* Clubs played at visibility
* Ranking visibility where policy allows
* Contact discoverability
* Player connection permissions

Required operational records may still be retained according to platform/business policy even if not publicly displayed.

---

# 28. TOP PLAYERS


Create public and private rankings using the same global player identities.

Route:

`/players/rankings`

Ranking modes:

* CourtPrime Global
* Organization
* Branch
* City
* Province
* Region
* Singles
* Doubles
* Mixed
* Men
* Women
* Age division
* Skill bracket
* Period

Leaderboard columns:

* Rank
* Player
* CourtPrime Player ID where appropriate
* Rating
* Matches
* Wins
* Win %
* Trend
* Verified matches

Example:

1 ▲ Juan Santos — 4.82
2 — Mark Reyes — 4.75
3 ▼ Carlo Cruz — 4.69

Do not hardcode ranking calculations.

Create a `PlayerRankingService` / ranking engine.

Keep ranking methodology configurable so CourtPrime can later support:

* Custom EAJ CourtPrime rating
* DUPR-like methodology
* Elo-style systems
* Glicko-style systems
* Organization-only rankings

Rating updates should be driven by eligible verified matches.

Support rating eligibility rules.

Example:

* Verified organization match
* Verified tournament match
* Verified open-play match when scorekeeping requirements are met
* Casual/unverified match may be excluded from global rating

Store rating history.

Never allow an organization to directly overwrite a player's global rating without an authorized auditable process.

---

# 29. PLAYER ACHIEVEMENTS

Optional gamification:

* First Win
* 10 Match Winner
* Tournament Champion
* 30-Day Streak
* 100 Matches
* Club Veteran
* Open Play Regular

Show badges in player profile.

---

# 30. MATCH HISTORY


Record match history using the global player identity.

Each match should store:

* organization_id
* branch_id
* court_id
* Match type
* Players
* Teams
* Scores
* Winner
* Duration
* Date
* Event
* Tournament if applicable
* Open play session if applicable
* Rating eligibility
* Verification status
* Rating impact
* Scorekeeper / source
* Visibility status

Players can view their permitted match history across organizations from one CourtPrime account.

Organization staff can view:

* Matches hosted by their organization
* Match data they are authorized to access

Organization A must not gain access to Organization B's private operational notes through global match history.

Public/global history should expose only fields explicitly designated as public or player-visible.

---

# 31. TOURNAMENT MANAGEMENT

Create a complete tournament engine.

Create tournaments with:

* Tournament name
* Branch
* Venue
* Start/end dates
* Registration dates
* Registration fee
* Maximum participants
* Divisions
* Skill groups
* Age groups
* Gender category
* Match format
* Rules

Tournament formats:

* Single elimination
* Double elimination
* Round robin
* Group stage
* Knockout
* Custom bracket

---

# 32. TOURNAMENT REGISTRATION

Players can register online.

Support:

* Singles
* Doubles
* Partner invitation
* Team registration
* Registration fees
* Waitlist
* Approval
* Check-in

---

# 33. TOURNAMENT BRACKET

Create a premium interactive bracket UI.

Features:

* Zoom
* Pan
* Desktop
* Tablet
* Mobile
* Live score
* Winner advancement
* Court assignment

Bracket automatically progresses after match completion.

---

# 34. TOURNAMENT COMMAND CENTER

Tournament director dashboard:

* Total Players
* Checked In
* Matches Completed
* Matches Pending
* Courts Available
* Matches Live
* Delayed Matches

Queue matches intelligently based on court availability.

---

# 35. POINT OF SALE

Build a complete modern POS.

Route:

`/pos`

Use a premium touch-friendly interface.

Products/services:

* Court rental
* Membership
* Tournament entry
* Open play
* Coaching
* Paddle rental
* Paddle sale
* Pickleballs
* Shirts
* Shoes
* Drinks
* Food
* Accessories
* Other merchandise

POS layout:

Left:

* Search
* Categories
* Product grid

Right:

* Current cart
* Customer
* Discount
* Tax
* Subtotal
* Payment
* Complete Sale

---

# 36. POS PAYMENT METHODS

Support configurable:

* Cash
* GCash
* Maya
* Card
* Bank Transfer
* Player Wallet
* Complimentary
* Other

Architecture should allow payment gateway integration later.

Support:

* Split payments
* Partial payments
* Refunds
* Discounts
* Promo codes
* Senior/PWD discount configuration if applicable
* Void transactions with permission
* Supervisor approval

---

# 37. CASHIER SESSION

Cashiers must open and close a register.

Opening:

* Opening cash

During shift:

* Cash in
* Cash out

Closing:

* Expected cash
* Actual cash
* Difference
* Notes

Generate shift reconciliation.

---

# 38. RECEIPTS

Create:

* Printable receipt
* Thermal receipt format
* PDF receipt
* Email receipt

Include:

* Tenant logo
* Branch
* Receipt number
* Items
* Tax
* Discounts
* Total
* Payment method
* Cashier
* Date/time

---

# 39. INVENTORY

Create comprehensive inventory management.

Product fields:

* SKU
* Barcode
* Name
* Category
* Brand
* Cost
* Selling price
* Stock
* Reorder level
* Unit
* Supplier
* Branch availability

Support:

* Purchase
* Receive stock
* Adjustment
* Damage
* Loss
* Return
* Transfer
* Sale

Maintain stock movement ledger.

Never simply overwrite quantity without keeping history.

---

# 40. STOCK TRANSFER

Allow stock transfer between branches.

Flow:

Draft
→ Requested
→ Approved
→ In Transit
→ Received
→ Completed

Maintain full audit logs.

---

# 41. MEMBERSHIP MANAGEMENT

Membership plans:

* Monthly
* Quarterly
* Semiannual
* Annual
* Custom

Benefits can include:

* Discounted court rates
* Free booking hours
* Priority booking
* Free open play
* Tournament discounts
* Guest passes
* POS discounts

Membership profile:

* Plan
* Start
* Expiration
* Status
* Remaining benefits
* Payments

Statuses:

* Active
* Expiring
* Expired
* Frozen
* Cancelled

---

# 42. MEMBER QR CODE


Each global CourtPrime player should receive a secure CourtPrime QR identity.

The QR should identify the same player across participating organizations.

Use for:

* Club check-in
* Player lookup
* Organization membership verification
* POS customer lookup
* Event registration
* Tournament registration
* Open play check-in

Do not place sensitive database IDs directly inside the QR code.

Use secure random / signed tokens.

When scanned by Organization A:

* Resolve the global player identity
* Load Organization A's relationship with that player
* Show Organization A's membership/status
* Show Organization A's reservations
* Show Organization A's outstanding balance if authorized

Do not load Organization B's private information.

Support token rotation/revocation if needed.

---

# 43. CLUB CHECK-IN

Front desk dashboard:

Search:

* Name
* Phone
* Member ID
* QR

Show:

* Membership status
* Reservation
* Outstanding balance
* Waiver status

Button:

**Check In**

---

# 44. DIGITAL WAIVERS

Create reusable waiver templates.

Players can digitally acknowledge/sign.

Track:

* Waiver version
* Player
* Signed date
* IP if legally appropriate
* Device/session information
* Consent timestamp

Require current waiver before certain reservations if enabled.

---

# 45. COACHING MODULE

Create coaches.

Coach profile:

* Bio
* Photo
* Skills
* Certification
* Rate
* Availability
* Branches

Players can book:

* Private lesson
* Group lesson
* Clinic

Coaching sessions should reserve courts automatically when required.

---

# 46. CRM


Create lightweight tenant-scoped customer relationship management.

CRM belongs to each organization.

Track organization-specific:

* Leads
* Prospects
* Connected players
* Members
* Inactive players
* VIP players
* Follow-ups
* Tags
* Communications
* Internal notes

Organization player timeline may show that organization's:

* First connected
* Reservation
* Payment
* Membership
* Tournament participation hosted by that organization
* POS transaction
* Communication

Do not expose another organization's CRM notes or customer classifications.

Global sports history and organization CRM history are separate concepts.

---

# 47. NOTIFICATIONS

Notification channels architecture:

* In-app
* Email
* SMS
* Push notification

Events:

* Reservation confirmed
* Booking reminder
* Booking cancelled
* Payment received
* Membership expiring
* Tournament starting
* Open play opening
* Waitlist promoted
* Match assigned
* Score completed
* Promo announcement

Notification templates should be customizable.

---

# 48. ANNOUNCEMENTS

Managers can create announcements.

Audience:

* All players
* Branch
* Members
* Tournament participants
* Open play participants
* Staff

Include scheduling.

---

# 49. FINANCE

Create financial modules for:

* Sales
* Reservation income
* Membership income
* Tournament income
* Coaching income
* Merchandise income
* Expenses
* Refunds
* Discounts
* Taxes
* Accounts receivable

---

# 50. EXPENSE MANAGEMENT

Expense fields:

* Branch
* Category
* Supplier
* Amount
* Payment method
* Date
* Receipt
* Notes
* Approver

Categories:

* Utilities
* Rent
* Salary
* Equipment
* Maintenance
* Supplies
* Marketing
* Other

---

# 51. REPORTS

Create advanced reports.

## Revenue Report

By:

* Date
* Branch
* Category
* Payment method

## Court Revenue

## Court Utilization

## Reservation Report

## Cancellation Report

## No-Show Report

## Membership Report

## POS Sales Report

## Inventory Report

## Tournament Revenue

## Open Play Revenue

## Coaching Revenue

## Player Activity

## Staff Performance

## Expense Report

## Profitability

Allow:

* Date filters
* Branch filter
* Export
* Print

Exports:

* CSV
* Excel
* PDF

---

# 52. EXECUTIVE ANALYTICS

Create business intelligence views.

KPIs:

* Revenue
* Gross sales
* Net sales
* Revenue per court
* Revenue per branch
* Court utilization
* Peak hours
* Average reservation value
* Reservations per day
* Cancellation rate
* No-show rate
* Membership retention
* Player retention
* New players
* Returning players
* Average player spending
* Tournament participation
* Open play participation

---

# 53. COURT UTILIZATION HEATMAP

Create a heatmap.

Rows:

Days of week

Columns:

Hours

Show court occupancy.

Allow branch and court filters.

This helps businesses understand peak periods.

---

# 54. OPERATIONS COMMAND CENTER

Create:

`/operations`

This should be a centralized live operations screen.

Show:

* Courts currently active
* Current players
* Upcoming reservations
* Walk-ins
* Open play queue
* Tournament matches
* Check-ins
* Maintenance alerts
* Pending payments

Designed for front desk and managers.

---

# 55. MAINTENANCE MANAGEMENT

Court maintenance records:

* Court
* Issue
* Priority
* Description
* Reported by
* Assigned to
* Start
* Expected completion
* Cost
* Photos
* Status

Statuses:

* Reported
* Scheduled
* In Progress
* Completed
* Cancelled

When a court is under maintenance, prevent booking.

---

# 56. STAFF MANAGEMENT

Staff profiles:

* Employee ID
* Name
* Branch
* Position
* Roles
* Contact
* Hire date
* Status

Optional attendance:

* Time in
* Time out
* Branch
* Device
* QR
* GPS where enabled

---

# 57. AUDIT LOG

Every sensitive system action should be auditable.

Store:

* User
* Action
* Model
* Record
* Old values
* New values
* IP address
* Device
* Timestamp

Examples:

* Reservation edited
* Payment refunded
* Price changed
* Inventory adjusted
* Score corrected
* Subscription modified
* Permission changed

---

# 58. ACTIVITY TIMELINE

Use activity timelines on:

* Player profiles
* Reservations
* POS transactions
* Tournaments
* Subscription accounts
* Inventory transfers

---

# 59. GLOBAL SEARCH


Create search appropriate to the current context.

## Tenant admin global search

Within an organization, search:

* Connected players
* Reservations
* Transactions
* Courts
* Products
* Tournaments
* Members
* Staff

Shortcut:

`Ctrl/Cmd + K`

Use a shadcn Command Dialog.

Tenant search must remain organization-scoped.

## Platform player search

Player-facing/public discovery may search:

* Connected clubs
* Branches
* Courts
* Public players
* Public rankings
* Public tournaments
* Public open play
* Public live matches

Respect player privacy and organization visibility settings.

## EAJ Superadmin search

May search across organizations only with platform-level authorization.

---

# 60. ADMIN SIDEBAR


Do not force every role into the exact same sidebar.

Use a reusable AppShell architecture with navigation generated from permissions and workspace context.

## Platform Superadmin sidebar

Overview:
* Platform Dashboard
* Network Analytics
* Organizations
* Subscriptions
* Billing
* Global Players
* Demo Requests
* Support

Platform:
* Plans
* Feature Flags
* Notifications
* Audit Logs
* Settings

---

## Organization Owner / Manager sidebar

Overview:
* Dashboard
* Operations
* Live Courts

Bookings:
* Reservations
* Court Scheduler
* Open Play
* Check-In

Sports:
* Matches
* Tournaments
* Rankings
* Coaches

Customers:
* Players
* Memberships
* CRM
* Waivers

Sales:
* POS
* Transactions
* Cashier Sessions
* Payments

Inventory:
* Products
* Stock
* Transfers
* Suppliers

Business:
* Branches
* Courts
* Staff
* Expenses

Analytics:
* Reports
* Analytics

System:
* Users
* Roles & Permissions
* Notifications
* Audit Logs
* Settings

---

## Branch Staff / Front Desk sidebar

Keep compact:

* Operations
* Reservations
* Scheduler
* Check-In
* Open Play
* Live Courts
* Players

Only show permitted modules.

---

## Cashier sidebar

Keep extremely focused:

* POS
* Transactions
* Cashier Session
* Payments
* Customer Lookup

Do not show management-only modules.

---

## Player navigation

Do not use the admin sidebar.

Use mobile-first bottom/tab navigation:

* Home
* Find Courts
* Bookings
* Play
* Profile

Secondary player menu:

* Rankings
* Tournaments
* Live
* Memberships
* Wallets
* Achievements
* Settings

---

Desktop sidebars should be collapsible.

Collapsed branded mode should use:

`/cp.png`

Use Lucide icons for navigation.

Do not use emoji as primary product navigation icons.

---

# 61. TOP BAR


Create a context-aware top bar.

Shared authenticated features may include:

* Mobile menu
* Search / command palette
* Notifications
* Theme switcher
* User menu

## Platform Superadmin top bar

Include:

* Platform status
* Global search
* Quick tenant lookup
* Notifications
* User menu

## Organization top bar

Include:

* Organization / branch selector
* Quick Create
* Live status
* Notifications
* Search
* User menu

Quick Create may include:

* Reservation
* Player link/invite
* Sale
* Open Play
* Tournament

## Cashier top bar

Keep minimal:

* Branch
* Register status
* Cashier name
* Notifications
* Exit/lock
* Workspace switcher if available

## Player top bar

Mobile-first:

* Compact `/cp.png`
* Location
* Notifications
* Player avatar

## Workspace switcher

If user has more than one permitted workspace, show:

* Current persona
* Current organization
* Switch workspace

Do not let a browser-supplied organization selector bypass server authorization.

---


# 61A. UNIFIED AUTHENTICATED IDENTITY REQUIREMENT

Because Platform Admin, Court Owner, Staff/Cashier and Player use one sign-in system:

* Do not create separate authentication tables per persona.
* Keep one canonical authenticated user identity.
* Attach player profile when the user is a player.
* Attach organization roles through scoped relationships.
* Attach platform roles through platform-scoped relationships.

A user can therefore be:

* Player only
* Staff only
* Owner only
* Owner + Player
* Coach + Player
* Platform Admin + Player
* Staff at more than one authorized organization

The UI must resolve workspace context after login.

The backend must authorize every context change.

---

# 62. DATABASE DESIGN


Create properly normalized Laravel migrations.

The database must distinguish platform-global identities from tenant-owned business records.

Core tables should include or equivalent:

## Platform / Identity

* users
* player_profiles or players
* player_identity_tokens
* player_privacy_settings
* player_merge_requests
* player_merge_logs
* organizations
* organization_settings
* organization_players
* branches
* courts
* court_rates
* court_operating_hours
* court_maintenance

## Roles / Access

* roles
* permissions
* role_permissions
* user_roles
* organization_users or equivalent organization staff relationship

## Global Player Sports Data

* player_ratings
* player_rating_history
* player_achievements
* player_achievement_awards
* player_connections if implemented

## Tenant Membership / Customer Data

* memberships
* membership_plans
* membership_benefits
* organization_wallets if wallets are used
* organization_wallet_transactions if wallets are used

## Reservations

* reservations
* reservation_players
* reservation_addons
* reservation_payments
* reservation_logs

Reservations must contain organization_id and branch_id.

`reservation_players.player_id` should reference the global player identity.

## Open Play

* open_play_sessions
* open_play_players
* open_play_queue

## Matches / Scoring

* matches
* match_players
* match_games
* score_events

Matches should be organization-scoped but reference global player IDs.

## Tournaments

* tournaments
* tournament_divisions
* tournament_registrations
* tournament_brackets
* tournament_matches

## POS / Inventory

* products
* product_categories
* suppliers
* inventories
* inventory_movements
* stock_transfers
* stock_transfer_items
* pos_transactions
* pos_transaction_items
* payments
* refunds
* cashier_sessions
* cash_movements
* expenses

## Coaching / Waivers / Communication

* coaches
* coaching_sessions
* waivers
* player_waivers
* announcements
* notification_templates
* notifications

## Platform / SaaS

* audit_logs
* subscriptions
* subscription_plans
* subscription_plan_features
* subscription_payments
* subscription_invoices
* demo_requests
* support_tickets

Use foreign keys.

Use indexes intelligently.

Important indexes may include:

* organization_id
* branch_id
* court_id
* player_id
* user_id
* booking date/time
* match date
* rating scope
* searchable player identifiers

Use decimal fields for currency.

Never use floating point for monetary amounts.

Do not duplicate platform-global players inside each organization.

Use `organization_players` as the relationship layer.

---

# 63. SERVICE CLASSES

Do not place all business logic inside controllers.

Create service classes such as:

* ReservationService
* ReservationPricingService
* CourtAvailabilityService
* SubscriptionService
* FeatureAccessService
* POSService
* PaymentService
* InventoryService
* TournamentService
* BracketService
* MatchScoringService
* PlayerRankingService
* OpenPlayService
* MembershipService
* ReportService

Use transactions for operations involving multiple database writes.

---

# 64. SECURITY

Implement:

* CSRF protection
* Authentication
* Authorization
* Rate limiting
* Tenant isolation
* Secure password policies
* Email verification
* Session management
* Signed URLs where appropriate
* File upload validation
* MIME type checks
* SQL injection protection using Eloquent/query builder
* XSS protection
* Secure API access
* Audit logging

Never rely on frontend permissions alone.

Every protected operation must be authorized by Laravel.

---


# 64A. DATA OWNERSHIP & VISIBILITY

Define ownership explicitly.

## Player-owned/platform-managed identity

* CourtPrime account
* CourtPrime Player ID
* Player profile
* Privacy settings

## Platform-derived sports data

* Global rating
* Rating history
* Verified match aggregation
* Global achievements
* Global ranking

## Organization-owned records

* Reservation
* Membership
* Organization wallet
* Payment
* POS purchase
* Waiver
* CRM note
* Customer tag
* Internal note
* Discount
* Outstanding balance

## Shared-reference sports records

A match hosted by an organization remains organization-scoped operationally but may contribute approved public/verified result fields to global player history.

Never copy entire tenant records into global tables merely for convenience.

Use explicit projection/visibility services.

---

# 65. MULTI-TENANT SECURITY


This is critical.

CourtPrime intentionally has both:

* Shared global player identity
* Strict tenant business isolation

These are not contradictory.

## Global identity access

A global player may be referenced across organizations by the same `player_id`.

Safe global/public fields may be available based on privacy and permissions.

## Tenant isolation

A user from Organization A must NEVER retrieve Organization B's private tenant records.

Protect:

* Reservations
* Payments
* Memberships
* Wallets
* POS transactions
* CRM notes
* Waivers
* Discounts
* Balances
* Inventory
* Expenses
* Employees
* Pricing rules
* Private operational data

Implement organization scoping centrally.

Avoid manually remembering to add:

`where('organization_id', ...)`

to every query.

Create an appropriate tenant scope / tenancy architecture.

Global player models must not accidentally bypass tenant security for related financial/customer data.

Recommended service boundaries:

* GlobalPlayerService
* OrganizationPlayerService
* TenantContextService
* PlayerVisibilityService

Superadmin should be explicitly allowed to cross tenant boundaries.

Log privileged cross-tenant access where appropriate.

Add automated tests specifically proving:

* Same player can belong to Organization A and B
* Organization A can see the shared player's allowed global fields
* Organization A can see its own organization_player relationship
* Organization A cannot see Organization B's membership
* Organization A cannot see Organization B's payments
* Organization A cannot see Organization B's CRM notes
* Global rating can include eligible matches from both organizations

---

# 66. REAL-TIME ARCHITECTURE

Use WebSocket/event broadcasting for:

* Live scoring
* Court status
* Match changes
* Queue changes
* Tournament brackets
* Lobby display

Events example:

* MatchScoreUpdated
* MatchCompleted
* CourtStatusChanged
* ReservationCreated
* ReservationCheckedIn
* OpenPlayQueueUpdated
* TournamentBracketUpdated

React should subscribe and update without refreshing.

---

# 67. PERFORMANCE

Optimize for businesses potentially having:

* 50+ branches
* 500+ courts
* 100,000+ players
* Millions of reservations
* Millions of POS transaction items

Implement:

* Pagination
* Database indexes
* Eager loading
* Query optimization
* Caching
* Queue processing
* Background report generation
* Lazy loading
* Virtualized UI where useful

Avoid N+1 queries.

---

# 68. RESPONSIVE DESIGN

Support:

* Desktop
* Laptop
* Tablet
* Mobile
* POS touch screen
* Large TV
* Lobby display

Admin experience should remain functional on tablets.

Player portal should prioritize mobile.

Live display should optimize for televisions.

---

# 69. ACCESSIBILITY

Implement:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Proper labels
* ARIA where necessary
* Sufficient contrast
* Accessible dialogs

Do not create UI that only works with a mouse.

---

# 70. FORM UX

Use:

* React Hook Form if compatible
* Zod validation if compatible
* Server-side Laravel validation

Provide:

* Clear field labels
* Inline validation
* Loading state
* Disabled submit while processing
* Success feedback
* Unsaved-change protection

---

# 71. TABLE UX

Every major data table should include:

* Search
* Filtering
* Sorting
* Pagination
* Column visibility
* Row actions
* Bulk actions where appropriate
* Date filters
* Branch filters
* Export

Use modern shadcn table patterns.

---

# 72. LOADING EXPERIENCE

Create:

* App loading screen
* Route skeletons
* Card skeletons
* Table skeletons
* Chart skeletons

Use the square EAJ logo in the main application loading animation.

Keep animation subtle.

---

# 73. EMPTY STATES

Do not show blank tables.

Example:

No reservations yet.

**Create your first reservation to start managing your courts.**

[Create Reservation]

Add appropriate icon or illustration.

---

# 74. ERROR HANDLING

Create polished pages for:

* 403
* 404
* 419
* 422
* 429
* 500
* 503

Use EAJ branding.

---

# 75. SETTINGS

Organization settings:

## General

* Company
* Logo
* Contact
* Address
* Currency
* Timezone

## Reservations

* Booking rules
* Cancellation
* Deposits
* Rates

## POS

* Taxes
* Receipt
* Payment methods

## Membership

* Rules
* Renewal

## Notifications

* Email
* SMS
* Push

## Live Display

* Branding
* Rotation
* Announcements

## Integrations

* Payment gateway
* SMS gateway
* Email
* API

---

# 76. CUSTOM BRANDING

Enterprise tenants may have:

* Organization logo
* Custom colors
* Lobby display branding
* Receipt branding
* Player portal branding

EAJ Platform Superadmin decides which plans receive this capability.

Do not remove required EAJ attribution unless the plan explicitly allows white labeling.

---


# 76A. PUBLIC PLAYER NETWORK ROUTES

Recommended routes:

`/play`
Discover available courts

`/clubs`
Browse connected clubs

`/club/{slug}`
Public club profile

`/rankings`
Global rankings

`/live`
Public live matches

`/tournaments`
Public tournaments

`/open-play`
Public open-play discovery

`/player/{courtprimeId}`
Public player profile when visibility permits

`/me`
Signed-in player portal

These routes belong to the centralized CourtPrime platform.

Tenant admin routes remain organization-authorized.

---

# 77. PUBLIC CLUB PAGE


Create public pages for connected CourtPrime facilities.

Routes may include:

`/clubs`

`/club/{slug}`

`/club/{slug}/branch/{branchSlug}`

Public club page may show:

* Club name
* Organization branding
* Description
* Branches
* Locations
* Operating hours
* Amenities
* Available courts
* Public rates
* Upcoming events
* Open play
* Tournaments
* Public live matches
* Top players for that organization
* Book button

Players remain signed into their global CourtPrime account while moving between club pages.

Booking a club should create a reservation under that organization without creating a new player identity.

Support organization visibility controls for what is public.

---

# 78. PWA READINESS

Make player-facing and operational interfaces PWA-ready.

Include:

* Manifest
* Icons
* Theme colors
* Installability
* Responsive design

Architecture should allow future push notifications.

---

# 79. API READINESS

Structure services so future APIs can expose:

* Reservations
* Courts
* Scores
* Tournaments
* Players
* Rankings

Enterprise plan can later receive API keys.

Do not expose APIs without proper authentication and authorization.

---

# 80. SAMPLE DATA


Create realistic seed data that demonstrates the centralized network.

Create multiple independent organizations.

Example:

Organization A:
Metro Pickle Club

Branches:
* Bacolod Sports Center
* Silay Pickle Hub

Organization B:
Negros Prime Pickle

Branches:
* Dumaguete Pickleball Hub

Organization C:
Cebu Pickle Arena

Branches:
* Cebu Central
* Mandaue Courts

Create multiple courts for every branch.

Create global players such as:

Juan Santos
`CP-PLY-000001`

Maria Cruz
`CP-PLY-000002`

Carlo Reyes
`CP-PLY-000003`

Link the same players to multiple organizations using `organization_players`.

Example:

Juan Santos:
* Metro Pickle Club
* Negros Prime Pickle
* Cebu Pickle Arena

Seed cross-organization:

* Reservations
* Matches
* Rankings
* Open Play
* Memberships
* Products
* POS transactions
* Tournaments
* Staff
* Coaches

Important:

Juan should have only one global player record even when he appears in data for multiple organizations.

Create organization-specific memberships and wallet balances separately.

Dashboard and player portal should look complete immediately after seeding.

Do not use Lorem Ipsum for important UI.

---

# 81. DEMO ACCOUNTS

Seed demo roles.

Example:

Superadmin
Organization Owner
Branch Manager
Front Desk
Cashier
Tournament Director
Scorekeeper
Player

Never use insecure passwords in production.

Development seed passwords may be documented separately.

---

# 82. TESTING


Create automated tests for critical workflows.

Test:

## Tenant security

* Tenant isolation
* Organization A cannot retrieve Organization B reservations
* Organization A cannot retrieve Organization B memberships
* Organization A cannot retrieve Organization B wallet balances
* Organization A cannot retrieve Organization B POS transactions
* Organization A cannot retrieve Organization B CRM notes

## Global player identity

* Same player can connect to multiple organizations
* Same global player ID is used across organizations
* Front desk global lookup links existing player instead of duplicating
* Provisional player claim flow
* Duplicate merge permissions
* Global profile privacy rules

## Cross-organization sports record

* Match from Organization A references global player
* Match from Organization B references same global player
* Eligible matches contribute to one global rating/history
* Organization-only ranking filters work
* Branch ranking filters work
* Global ranking works

## Reservations

* Court availability
* Double booking prevention
* Reservation creation
* Reservation cancellation
* Reservation pricing
* Cross-organization player booking
* Membership discount only applies to correct organization

## Commerce

* POS sale
* Inventory deduction
* Refund
* Wallet isolation if wallets are enabled

## Competition

* Tournament progression
* Live scoring
* Rating eligibility

## SaaS

* Subscription restrictions
* Role permissions
* Feature flags

Use Laravel Feature Tests and Unit Tests.

---

# 83. DEMO MODE

Create an optional demo tenant mode.

This can be used for prospective EAJ clients.

Features:

* Reset demo data
* Prevent destructive system settings
* Prevent actual external payments
* Clearly indicate Demo Environment

Do NOT make the demo look incomplete.

It should showcase all major features.

---

# 84. SAAS SALES PIPELINE

Within EAJ Superadmin create:

Demo Request
→ Qualified
→ Demo Scheduled
→ Demo Completed
→ Proposal
→ Negotiation
→ Won
→ Tenant Created

Allow sales notes and follow-up dates.

---

# 85. NOTIFICATION CENTER

Build a notification drawer.

Categories:

* Reservation
* Payment
* Membership
* Tournament
* System
* Inventory

Allow:

* Mark as read
* Mark all read
* Open related record

---

# 86. GLOBAL QUICK ACTIONS

Add floating/command actions.

`Ctrl/Cmd + K`

Options:

* New Reservation
* New Player
* Open POS
* Check In Player
* Start Open Play
* Create Tournament
* Search Player
* Search Reservation

---

# 87. DASHBOARD PERSONALIZATION

Allow dashboard widgets to adapt by role.

Owner sees:

* Revenue
* Analytics
* Branch comparison

Front desk sees:

* Current courts
* Upcoming reservations
* Check-ins

Tournament Director sees:

* Current tournament
* Courts
* Match queue

Cashier sees:

* POS sales
* Cash register
* Pending payments

---

# 88. ADMIN NOTIFICATION BADGES

Sidebar can display counters such as:

Reservations `12`

Pending Payments `4`

Stock Alerts `7`

Demo Requests `3`

Do not query expensive counts on every render.

Use optimized aggregated queries/cache.

---

# 89. MOBILE PLAYER HOME


Design a premium sports-app-like home screen for the global player.

Header:

EAJ CourtPrime

Hello, Juan 👋

CourtPrime Player ID:

`CP-PLY-000001`

Current global rating:

4.21

Global rank:

#128

Next Game:

Tonight • 7:30 PM
Metro Pickle Club
Bacolod Branch
Court 3

Quick Actions:

* Find Court
* Book Court
* Open Play
* Tournament
* Rankings
* Live

Upcoming bookings:

Show bookings across multiple organizations.

Latest Results:

Metro Pickle Club
W 11-8

Prime Pickle Center
L 9-11

Cebu Pickle Arena
W 11-6

Connected clubs:

* Metro Pickle Club
* Prime Pickle Center
* Cebu Pickle Arena

Organization memberships:

Display separately.

Achievements:

Show recent badges.

The home screen should make the network concept obvious.

---

# 90. LIVE MATCH PLAYER VIEW

Players can open a match.

Show:

TEAM A

11

TEAM B

9

Game 2

Court 4

Below:

* Game history
* Player profiles
* Tournament
* Match time

Update live.

---

# 91. TV DISPLAY DESIGN

Large typography.

High contrast.

Minimal navigation.

Target viewing distance several meters away.

Avoid tiny text.

Support:

`?branch=1`

and optionally court filters.

Provide secure display tokens if displays should not require interactive user login.

---

# 92. PREMIUM MICROINTERACTIONS

Add subtle effects:

* Court card glow when live
* Pulsing LIVE badge
* Score flip/update animation
* Reservation placement animation
* Animated leaderboard position changes
* Revenue count-up
* Check-in confirmation
* POS success
* Tournament advancement

Do not use distracting continuous motion.

---

# 93. DATE / TIME HANDLING

Store timestamps consistently.

Respect tenant/branch timezone.

Display local branch time.

Court reservations must use the correct branch timezone.

Avoid timezone bugs for organizations operating in different locations.

---

# 94. MONEY HANDLING

Use decimal database values.

Create centralized currency formatting.

Support initial currency:

PHP / ₱

Architecture should support other currencies later.

---

# 95. STATUS DESIGN SYSTEM

Centralize status variants.

Examples:

Available
Reserved
Live
Maintenance
Cancelled
Paid
Pending
Expired
Active

Do not manually redefine colors in individual pages.

Create reusable badge/status components.

---

# 96. REUSABLE COMPONENTS

Create reusable components such as:

* AppShell
* PageHeader
* StatsCard
* DataTable
* EmptyState
* ConfirmDialog
* StatusBadge
* BranchSelector
* DateRangePicker
* CurrencyDisplay
* PlayerAvatar
* CourtStatusCard
* LiveScoreCard
* ReservationCard
* PaymentBadge
* MembershipBadge
* ChartCard
* Timeline
* ActivityFeed
* SearchCommand
* PageSkeleton

Avoid duplicate UI implementations.

---

# 97. CODE QUALITY

Use:

* Clean naming
* Small controllers
* Form Requests
* Policies
* Services
* Resources
* Enums where appropriate
* Events/listeners
* Jobs
* Notifications

Avoid:

* 1,000-line components
* Massive controllers
* Business logic duplicated in React
* Hardcoded tenant IDs
* Hardcoded pricing
* Hardcoded permissions

---

# 98. IMPLEMENTATION ORDER


Do not attempt random modules.

Follow this development order.

## PHASE 1 — Existing Project Audit

1. Inspect existing Laravel 12 structure
2. Inspect React/Inertia/API architecture
3. Inspect authentication
4. Inspect current users table
5. Inspect current role/permission implementation
6. Inspect routes
7. Inspect existing shadcn components
8. Inspect existing `public/` CourtPrime assets
9. Confirm all supplied CourtPrime image filenames
10. Preserve working functionality

## PHASE 2 — Unified Identity & Security

11. One `/login` page
12. Canonical `users` identity
13. Platform roles
14. Organization-scoped roles
15. Player profile relationship
16. Workspace resolver
17. Workspace switcher
18. Tenant context service
19. Policies
20. Permission gates
21. Login/session audit
22. Tenant isolation tests

## PHASE 3 — Global Player Network Foundation

23. CourtPrime Player ID
24. Global player profile
25. `organization_players`
26. Global player lookup
27. Duplicate prevention
28. Provisional walk-in profile
29. Profile claim flow
30. Privacy settings
31. Connected club relationship
32. Player QR identity

## PHASE 4 — Business Foundation

33. Organizations
34. Branches
35. Courts
36. Court rates
37. Operating hours
38. Subscription foundation
39. Organization settings
40. Staff assignment

## PHASE 5 — Role-Specific App Shells

41. Superadmin shell/dashboard
42. Court owner/manager shell/dashboard
43. Staff/front-desk shell/dashboard
44. Cashier/POS shell/dashboard
45. Player portal shell/dashboard
46. Workspace switching UI
47. Role-aware navigation
48. Context-aware top bars

## PHASE 6 — Core Operations

49. Reservations
50. Cross-organization booking discovery
51. Scheduler
52. Court availability
53. Check-in
54. Walk-ins
55. Operations command center
56. Live courts

## PHASE 7 — Commerce

57. POS
58. Payments
59. Cashier sessions
60. Products
61. Inventory
62. Stock transfers
63. Organization wallets if required
64. Receipts

## PHASE 8 — Pickleball Sports Engine

65. Matches
66. Live scoring
67. Score events
68. Open Play
69. Queue
70. Global rating engine
71. Organization rankings
72. Global rankings
73. Match verification
74. Match disputes/corrections

## PHASE 9 — Competition

75. Tournaments
76. Divisions
77. Registration
78. Brackets
79. Tournament command center
80. Cross-organization tournament discovery

## PHASE 10 — Membership & Customer Experience

81. Memberships
82. Waivers
83. Coaches
84. CRM
85. Notifications
86. Unified player bookings
87. Player memberships view
88. Player wallet views
89. Achievements

## PHASE 11 — Intelligence

90. Reports
91. Analytics
92. Court heatmaps
93. Executive analytics
94. Player activity analytics
95. Network-level Superadmin analytics

## PHASE 12 — SaaS Platform

96. Subscription management
97. Demo applications
98. Platform billing
99. Feature restrictions
100. Sales pipeline
101. Support tickets

## PHASE 13 — Premium Public Website

102. Brand asset components
103. Landing-page layout
104. Advanced scroll/motion system
105. Hero
106. Player-network story
107. Find Courts
108. Club directory
109. Booking marketing preview
110. Global history/rankings preview
111. Live scoring preview
112. Business OS section
113. POS/inventory section
114. Pricing
115. Demo request
116. Public club pages
117. Public rankings
118. Public live scoring
119. Public tournaments
120. Public Open Play

## PHASE 14 — Performance & Polish

121. Responsive optimization
122. Image optimization
123. Accessibility
124. Reduced-motion support
125. Lighthouse/performance review
126. Mobile player UX review
127. Tablet staff UX review
128. POS touch UX review
129. Large-TV display review
130. Production security review

Build identity, authorization and tenant isolation before relying on role-specific frontends.

---

# 99. IMPORTANT IMPLEMENTATION RULE

Before modifying the project:

1. Inspect the existing Laravel 12 project.
2. Inspect package.json.
3. Inspect composer.json.
4. Inspect routes.
5. Inspect authentication.
6. Inspect React folder structure.
7. Inspect existing shadcn components.
8. Inspect database migrations.
9. Inspect existing roles/permissions implementation.
10. Reuse existing infrastructure whenever possible.

Do NOT recreate functionality that is already correctly implemented.

Do NOT delete working modules simply to replace them with a different preference.

---

# 100. DO NOT CREATE ONLY STATIC MOCKUPS

Every page should eventually connect to real Laravel data.

Do not create:

* Fake buttons
* Buttons with no action
* Static tables pretending to work
* Hardcoded dashboard values
* Fake filters
* Fake booking states

If a module is implemented, implement its real backend logic.

---

# 101. MIGRATION SAFETY

Do NOT destroy existing production data.

Never casually use:

`migrate:fresh`

Do not drop existing tables unless explicitly required.

Create additive migrations.

Use safe schema changes.

---

# 102. LANDING PAGE QUALITY TARGET


The public website should feel comparable to a professionally funded premium sports SaaS company.

It must immediately communicate:

* One connected CourtPrime player network
* Independent business ownership
* Secure private tenant operations
* Premium sports experience
* Enterprise-ready software
* Fast booking
* Live sports capability
* Professional SaaS quality

Use the supplied CourtPrime logos and player/equipment artwork as primary visual assets.

Do not make the page look like:

* A generic admin template
* A plain Laravel starter page
* A static brochure
* A stock-photo sports website
* An over-glowing esports poster
* A page with random floating objects everywhere

## Scroll experience quality target

The landing page should have purposeful motion similar to premium modern product sites:

* Elements reveal as they enter viewport
* Hero composition has depth
* Sticky product demonstrations update during scroll
* Network lines animate only when relevant
* Cards stagger
* Numbers count once
* Score/ranking transitions demonstrate the product
* Navbar transforms smoothly

Motion must stay under control.

Page readability always wins over animation.

## Artwork placement quality

Use:

* `cp-model5.png` — hero / network
* `cp-model4.png` — global player/ranking
* `cp-model3.png` — player portal/profile
* `cp-model1.png` — booking/open play/live
* `cp-paddle2.png` — POS/inventory
* `cp-paddle3.png` — scroll motion accent
* `cp-paddle4.png` — tournament/open play feature art
* `cp-paddle.png` — booking/live feature art

Use:

* `cp3(1).png` — dark marketing header/hero
* `cp2(1).png` — light surfaces
* `cp1(1).png` — dark footer/secondary dark lockup
* `cp.png` — compact/app icon

Create meaningful interactive product previews.

Do not let marketing art overlap operational UI mockups in a way that makes them unreadable.

---

# 103. APPLICATION QUALITY TARGET

The authenticated dashboard should resemble a real operational platform that clubs would be comfortable running all day.

Priority:

1. Clarity
2. Speed
3. Operational usefulness
4. Professional appearance
5. Mobile responsiveness

---

# 104. FINAL BRAND POSITIONING


Use messaging that communicates both the player network and the business operating system.

Primary platform brand:

# EAJ CourtPrime

Primary positioning:

**One Player Identity. Every Connected Court.**

Supporting statement:

**The Operating System for Modern Pickleball Clubs — connected through one player network.**

Player-focused messaging:

**Play anywhere. Keep one record.**

**One profile. Every match. Every participating club.**

**Find courts, book games, join events and build your verified pickleball history from one CourtPrime account.**

Business-focused messaging:

**Run your entire pickleball business from one platform.**

**Every branch. Every court. Every reservation.**

**Connect your facility to a growing player network while keeping your business data private and fully controlled.**

Network statement:

**Independent clubs. Shared players. One connected pickleball ecosystem.**

Do not imply that participating organizations can see each other's private business data.

Make the distinction clear:

* Shared player identity
* Private business operations

---

# 105. PRIMARY LANDING PAGE CTA

Main CTA:

**Request a Live Demo**

Secondary CTA:

**See How It Works**

Never force prospective businesses to create an account before requesting a demo.

---

# 106. PUBLIC FOOTER

Include:

EAJ CourtPrime

A product of:

EAJ Web Development Services

Links:

* Product
* Features
* Pricing
* Demo
* Contact
* Privacy Policy
* Terms of Service
* Sign In

Copyright should automatically use the current year.

---

# 107. OVERALL GOAL


The final product must not feel like a simple reservation system.

It must feel like a complete **centralized pickleball ecosystem** containing two connected products:

## Product A — CourtPrime Business OS

For:

* Single-court businesses
* Small pickleball clubs
* Sports complexes
* Multi-court facilities
* Multi-branch pickleball businesses
* Tournament venues
* Large pickleball organizations

Capabilities include:

* Multi-branch + multi-court management
* Reservation engine
* POS
* Payments
* Membership
* Open Play
* Tournament management
* Live scoring
* Inventory
* Staff
* Finance
* CRM
* Analytics
* TV displays

## Product B — CourtPrime Player Network

For every player across the ecosystem.

Capabilities include:

* One CourtPrime player account
* One CourtPrime Player ID
* Cross-organization club discovery
* Cross-organization booking
* Unified upcoming bookings
* Global match history
* Global rating
* Global rankings
* Organization rankings
* Tournament discovery
* Open play discovery
* Live scoring
* Achievements
* QR identity
* Organization-specific memberships displayed in one portal
* Organization-specific wallets displayed separately
* Connected club history

Its strongest differentiators should be:

1. One global player identity across independent pickleball businesses
2. Strict isolation of each organization's private business data
3. Cross-club court discovery and booking
4. Verified cross-organization player match history
5. Global and local rankings
6. Multi-branch + multi-court management
7. Powerful reservation engine
8. Real-time court operations
9. Live scoring
10. Consolidated TV scoreboard
11. Open Play management
12. Tournament management
13. Full POS
14. Membership management
15. Inventory
16. Player self-service portal
17. Executive analytics
18. Subscription SaaS architecture

The finished product should be something EAJ Web Development Services can commercially offer to independent pickleball facilities under a monthly or annual subscription while simultaneously building a valuable connected network for players.

The architecture must create a network effect:

More CourtPrime clubs
→ more courts and events available to players
→ more player activity and verified records
→ more value for participating clubs
→ stronger CourtPrime ecosystem

Build it as an extensible enterprise platform, not a one-off custom application.

The core architectural rule must remain:

**One global player identity. Many independent organizations. Strict tenant privacy. One connected CourtPrime network.**

---

---

# 108. CRITICAL CENTRALIZED NETWORK RULE

Do not accidentally rebuild CourtPrime as isolated copies of the same software where every tenant owns a separate player table.

The intended architecture is:

**ONE COURTPRIME PLATFORM**

→ MANY INDEPENDENT PICKLEBALL ORGANIZATIONS

→ MANY BRANCHES

→ MANY COURTS

→ ONE GLOBAL PLAYER IDENTITY LAYER

A player should be able to move between participating facilities without creating a new account.

A business should be able to use that global player identity without gaining access to other businesses' private data.

Every implementation decision involving players must answer these questions:

1. Is this field global to the player's CourtPrime identity?
2. Is this field private to an organization?
3. Is this record organization-owned but allowed to contribute selected data to the player's global sports history?
4. What privacy rule controls visibility?
5. What authorization rule controls access?

If the answer is unclear, do not default to making the data globally visible.

Prefer strict tenant privacy with explicit global projections.

Final architectural statement:

**Shared identity does not mean shared business data.**

**One player. Many clubs. One connected record. Private tenant operations.**
---

# 109. COURTPRIME ASSET + UI ACCEPTANCE CHECKLIST

Before considering the redesign complete, verify:

## Logo usage

- [ ] Dark navbar/hero uses `cp3(1).png`
- [ ] Light surfaces use `cp2(1).png`
- [ ] Dark footer/secondary dark lockup uses `cp1(1).png`
- [ ] Compact icon contexts use `cp.png`
- [ ] No logo is stretched
- [ ] No logo has an artificial background box
- [ ] Logo remains crisp and readable

## Marketing artwork

- [ ] Hero uses `cp-model5.png`
- [ ] Player/ranking section uses `cp-model4.png`
- [ ] Player portal/profile section uses `cp-model3.png`
- [ ] Booking/Open Play/live section uses `cp-model1.png`
- [ ] POS/inventory uses `cp-paddle2.png`
- [ ] Motion accent uses `cp-paddle3.png`
- [ ] Feature/tournament art uses `cp-paddle4.png`
- [ ] Booking/live decorative art may use `cp-paddle.png`
- [ ] No artwork overlaps important text/buttons
- [ ] Mobile layouts remain clean

## Authentication

- [ ] Everyone uses one `/login`
- [ ] Superadmin does not need a separate public login page
- [ ] Court Owner does not need a separate public login page
- [ ] Cashier does not need a separate public login page
- [ ] Player does not need a separate public login page
- [ ] Role/workspace is resolved after successful authentication
- [ ] Multi-role users can switch workspace safely
- [ ] Workspace switching is server-authorized

## Dashboards

- [ ] Superadmin dashboard is platform/network/SaaS focused
- [ ] Court Owner dashboard is executive/business focused
- [ ] Staff dashboard is operational
- [ ] Cashier dashboard is POS focused
- [ ] Player dashboard is sports/mobile focused
- [ ] No persona receives a generic one-size-fits-all dashboard

## Motion

- [ ] Hero entrance is smooth
- [ ] Scroll reveals are consistent
- [ ] Network visualization animates
- [ ] Booking preview responds to scroll
- [ ] Score updates are animated
- [ ] Rankings animate appropriately
- [ ] Decorative motion is restrained
- [ ] `prefers-reduced-motion` works
- [ ] Animation does not degrade scroll performance

## Data security

- [ ] One global player identity can connect to multiple organizations
- [ ] Organizations cannot see each other's private data
- [ ] Player history can aggregate eligible verified matches
- [ ] Organization memberships remain separate
- [ ] Organization wallets remain separate
- [ ] Login identity is unified
- [ ] Permission enforcement is server-side

---

# 110. FINAL UI DIRECTION

The final CourtPrime product should feel like three premium experiences sharing one identity system:

### 1. CourtPrime Player Network
A polished sports app for players.

### 2. CourtPrime Business OS
A powerful private operating system for court owners and staff.

### 3. CourtPrime Platform Console
A SaaS/network command center for EAJ / CourtPrime platform administration.

All three experiences use:

* The same CourtPrime visual system
* The same core user identity/authentication
* The same brand assets
* Appropriate role/context authorization

But each experience must have a unique layout, information hierarchy, dashboard and navigation optimized for its user.

Final product principle:

**One secure sign-in. The right CourtPrime experience for every user.**

Final network principle:

**One player identity. Many independent clubs. Private business operations. One connected CourtPrime network.**
