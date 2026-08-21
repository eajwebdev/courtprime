import { type NavGroup, type NavItem, type ShellKind, type WorkspaceState } from '@/types';
import {
    ArrowRightLeft,
    BadgeCheck,
    BarChart3,
    Bell,
    BriefcaseBusiness,
    CalendarClock,
    ClipboardCheck,
    ClipboardList,
    Compass,
    CreditCard,
    GraduationCap,
    Home,
    IdCard,
    KeyRound,
    LayoutGrid,
    LifeBuoy,
    MapPin,
    Megaphone,
    RadioTower,
    ReceiptText,
    Rocket,
    Settings2,
    ShieldCheck,
    Trophy,
    User,
    Users,
    WalletCards,
    Warehouse,
    Wrench,
} from 'lucide-react';

type RoleKey =
    | 'eaj_superadmin'
    | 'organization_owner'
    | 'branch_manager'
    | 'front_desk'
    | 'cashier'
    | 'scorekeeper'
    | 'tournament_director'
    | 'player';

/**
 * Navigation architecture.
 *
 * Hard limits, enforced by `assertNavigationBudget` in development:
 *   · at most 7 items in any one group
 *   · at most 3 groups open by default
 *
 * Everything else is reachable through the ⌘K command menu, which indexes the
 * full destination list below. The command menu is the pressure valve, when a
 * group wants an eighth item, the item goes to ⌘K instead.
 */

const navItems = {
    dashboard: { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid, section: 'Overview' },

    playerHome: { title: 'Home', url: '/me', icon: Home, section: 'Player' },
    playerProfile: { title: 'Profile', url: '/me/profile', icon: User, section: 'Player' },
    playerBooking: { title: 'Book a court', url: '/me/book', icon: CalendarClock, section: 'Player' },
    playerWallet: { title: 'Wallet', url: '/me/wallet', icon: WalletCards, section: 'Player' },
    findCourts: { title: 'Discover courts', url: '/find-courts', icon: Compass, section: 'Player' },
    findOpenPlay: { title: 'Find open play', url: '/find-open-play', icon: Users, section: 'Player' },
    findTournaments: { title: 'Find tournaments', url: '/find-tournaments', icon: Trophy, section: 'Player' },
    leaderboards: { title: 'Leaderboards', url: '/leaderboards', icon: BarChart3, section: 'Player' },

    operations: { title: 'Operations', url: '/operations', icon: ClipboardCheck, section: 'Today' },
    liveCourts: { title: 'Live courts', url: '/live-courts', icon: RadioTower, section: 'Today' },
    checkIn: { title: 'Check-in', url: '/check-in', icon: ClipboardCheck, section: 'Today' },
    notifications: { title: 'Notifications', url: '/notifications', icon: Bell, section: 'Today' },

    reservations: { title: 'Reservations', url: '/reservations', icon: CalendarClock, section: 'Courts & bookings' },
    scheduler: { title: 'Scheduler', url: '/scheduler', icon: ClipboardList, section: 'Courts & bookings' },
    courts: { title: 'Courts', url: '/courts', icon: ClipboardList, section: 'Courts & bookings' },
    branches: { title: 'Branches', url: '/branches', icon: MapPin, section: 'Courts & bookings' },
    maintenance: { title: 'Maintenance', url: '/maintenance', icon: Wrench, section: 'Courts & bookings' },

    players: { title: 'Players', url: '/players', icon: Users, section: 'People' },
    memberships: { title: 'Memberships', url: '/memberships', icon: BadgeCheck, section: 'People' },
    staff: { title: 'Staff', url: '/staff', icon: IdCard, section: 'People' },
    coaches: { title: 'Coaches', url: '/coaches', icon: GraduationCap, section: 'People' },
    openPlay: { title: 'Open play', url: '/open-play', icon: Users, section: 'People' },
    duplicateIdentities: { title: 'Duplicate review', url: '/duplicate-identities', icon: Users, section: 'People' },
    teamRoles: { title: 'Team & roles', url: '/team-roles', icon: ShieldCheck, section: 'People' },

    pos: { title: 'POS', url: '/pos', icon: CreditCard, section: 'Money' },
    payments: { title: 'Payments', url: '/payments', icon: CreditCard, section: 'Money' },
    receivables: { title: 'Receivables', url: '/accounts-receivable', icon: ReceiptText, section: 'Money' },
    expenses: { title: 'Expenses', url: '/expenses', icon: ReceiptText, section: 'Money' },
    cashierSessions: { title: 'Cashier sessions', url: '/cashier-sessions', icon: CreditCard, section: 'Money' },

    tournaments: { title: 'Tournaments', url: '/tournaments', icon: Trophy, section: 'Competition' },
    matches: { title: 'Matches', url: '/matches', icon: Trophy, section: 'Competition' },
    rankings: { title: 'Rankings', url: '/rankings', icon: BarChart3, section: 'Competition' },
    reports: { title: 'Reports', url: '/reports', icon: BarChart3, section: 'Competition' },

    inventory: { title: 'Inventory', url: '/inventory', icon: Warehouse, section: 'Stock' },
    products: { title: 'Products', url: '/products', icon: Warehouse, section: 'Stock' },
    stockTransfers: { title: 'Stock transfers', url: '/stock-transfers', icon: ArrowRightLeft, section: 'Stock' },

    demoPipeline: { title: 'Demo pipeline', url: '/demo-pipeline', icon: BriefcaseBusiness, section: 'Platform' },
    onboarding: { title: 'Onboarding', url: '/onboarding', icon: Rocket, section: 'Platform' },
    subscriptionPlans: { title: 'Subscription plans', url: '/subscription-plans', icon: CreditCard, section: 'Platform' },
    tenantSubscriptions: { title: 'Tenant subscriptions', url: '/tenant-subscriptions', icon: CreditCard, section: 'Platform' },
    platformAudit: { title: 'Platform audit', url: '/platform-audit', icon: ShieldCheck, section: 'Platform' },
    apiCredentials: { title: 'API keys', url: '/api-credentials', icon: KeyRound, section: 'Platform' },

    announcements: { title: 'Announcements', url: '/announcements', icon: Megaphone, section: 'Admin' },
    supportTickets: { title: 'Support', url: '/support-tickets', icon: LifeBuoy, section: 'Admin' },
    organizationSettings: { title: 'Settings', url: '/organization-settings', icon: Settings2, section: 'Admin' },
} satisfies Record<string, NavItem>;

/* -------------------------------------------------------------------------- */
/* Persona architectures                                                       */
/* -------------------------------------------------------------------------- */

const ownerGroups: NavGroup[] = [
    { title: 'Today', defaultOpen: true, items: [navItems.dashboard, navItems.operations, navItems.liveCourts, navItems.checkIn] },
    {
        title: 'Courts & bookings',
        defaultOpen: true,
        items: [navItems.reservations, navItems.scheduler, navItems.courts, navItems.branches, navItems.maintenance],
    },
    {
        title: 'People',
        defaultOpen: true,
        items: [navItems.players, navItems.memberships, navItems.staff, navItems.coaches, navItems.openPlay],
    },
    {
        title: 'Money',
        defaultOpen: false,
        items: [navItems.pos, navItems.payments, navItems.receivables, navItems.expenses, navItems.cashierSessions],
    },
    {
        title: 'Growth',
        defaultOpen: false,
        items: [navItems.tournaments, navItems.matches, navItems.rankings, navItems.reports],
    },
];

const frontDeskGroups: NavGroup[] = [
    {
        title: 'Right now',
        defaultOpen: true,
        items: [navItems.operations, navItems.liveCourts, navItems.checkIn, navItems.reservations, navItems.scheduler],
    },
    { title: 'Players', defaultOpen: true, items: [navItems.players, navItems.openPlay, navItems.memberships] },
];

const superadminGroups: NavGroup[] = [
    {
        title: 'Platform',
        defaultOpen: true,
        items: [
            navItems.dashboard,
            navItems.tenantSubscriptions,
            navItems.demoPipeline,
            navItems.subscriptionPlans,
            navItems.onboarding,
            navItems.supportTickets,
            navItems.platformAudit,
        ],
    },
    {
        title: 'Club operations',
        defaultOpen: true,
        items: [
            navItems.operations,
            navItems.liveCourts,
            navItems.reservations,
            navItems.scheduler,
            navItems.courts,
            navItems.branches,
            navItems.maintenance,
        ],
    },
    {
        title: 'People & play',
        defaultOpen: true,
        items: [
            navItems.players,
            navItems.duplicateIdentities,
            navItems.memberships,
            navItems.staff,
            navItems.coaches,
            navItems.openPlay,
            navItems.teamRoles,
        ],
    },
    {
        title: 'Competition',
        defaultOpen: false,
        items: [navItems.tournaments, navItems.matches, navItems.rankings, navItems.reports],
    },
    {
        title: 'Money & stock',
        defaultOpen: false,
        items: [
            navItems.pos,
            navItems.payments,
            navItems.receivables,
            navItems.expenses,
            navItems.cashierSessions,
            navItems.inventory,
            navItems.products,
        ],
    },
    {
        title: 'Setup',
        defaultOpen: false,
        items: [navItems.organizationSettings, navItems.announcements, navItems.apiCredentials],
    },
];

const roleGroups: Record<RoleKey, NavGroup[]> = {
    eaj_superadmin: superadminGroups,
    organization_owner: ownerGroups,
    branch_manager: ownerGroups,
    front_desk: frontDeskGroups,
    cashier: [{ title: 'Cashier', defaultOpen: true, items: [navItems.pos, navItems.cashierSessions, navItems.payments] }],
    scorekeeper: [{ title: 'Scoring', defaultOpen: true, items: [navItems.liveCourts, navItems.matches, navItems.tournaments] }],
    tournament_director: [
        {
            title: 'Competition',
            defaultOpen: true,
            items: [navItems.tournaments, navItems.matches, navItems.openPlay, navItems.rankings, navItems.liveCourts],
        },
    ],
    player: [
        {
            title: 'Player',
            defaultOpen: true,
            items: [navItems.playerHome, navItems.playerBooking, navItems.findCourts, navItems.playerWallet, navItems.playerProfile],
        },
    ],
};

const roleShells: Record<RoleKey, ShellKind> = {
    eaj_superadmin: 'superadmin',
    organization_owner: 'owner',
    branch_manager: 'owner',
    front_desk: 'operations',
    scorekeeper: 'operations',
    tournament_director: 'operations',
    cashier: 'cashier',
    player: 'player',
};

/* -------------------------------------------------------------------------- */
/* Player bottom navigation, exactly five, thumb-reachable                    */
/* -------------------------------------------------------------------------- */

export const playerBottomNav: NavItem[] = [
    { title: 'Home', url: '/me', icon: Home },
    { title: 'Discover', url: '/find-courts', icon: Compass },
    { title: 'Play', url: '/me/book', icon: CalendarClock },
    /* `/live-courts` is an operator screen and returns 403 for players. The
       public live board is the player-facing equivalent. */
    { title: 'Live', url: '/display/live', icon: RadioTower },
    { title: 'Profile', url: '/me/profile', icon: User },
];

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

function roleOf(workspace?: WorkspaceState): RoleKey | null {
    return (workspace?.current.role as RoleKey | null | undefined) ?? null;
}

export function navigationForWorkspace(workspace?: WorkspaceState): NavGroup[] {
    const role = roleOf(workspace);

    if (!role) {
        return [{ title: 'CourtPrime', defaultOpen: true, items: [navItems.dashboard] }];
    }

    return roleGroups[role] ?? ownerGroups;
}

export function shellForWorkspace(workspace?: WorkspaceState): ShellKind {
    const role = roleOf(workspace);
    return role ? (roleShells[role] ?? 'owner') : 'owner';
}

export function primaryNavigationForWorkspace(workspace?: WorkspaceState): NavItem[] {
    return navigationForWorkspace(workspace)
        .flatMap((group) => group.items)
        .slice(0, 6);
}

/** Destinations every signed-in user can open, whatever their role. */
const universalDestinations: NavItem[] = [
    navItems.findCourts,
    navItems.findOpenPlay,
    navItems.findTournaments,
    navItems.leaderboards,
    navItems.notifications,
];

/**
 * Destinations for the ⌘K command menu, scoped to the current role.
 *
 * This used to return every route in the product. A player picking one of the
 * operator routes got a 403, so the menu now offers only what the workspace can
 * actually open, plus the public player destinations.
 */
export function commandDestinations(workspace?: WorkspaceState): NavItem[] {
    const fromNavigation = navigationForWorkspace(workspace).flatMap((group) => group.items);
    const seen = new Set<string>();

    return [...fromNavigation, ...universalDestinations].filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
}

/**
 * Development guardrail for the two navigation budgets. Called by the shell so
 * a regression surfaces in the console rather than in a design review.
 */
export function assertNavigationBudget(groups: NavGroup[], label: string) {
    if (import.meta.env.PROD) return;

    for (const group of groups) {
        if (group.items.length > 7) {
            console.warn(
                `[courtprime-shells] "${label}" group "${group.title}" has ${group.items.length} items; the budget is 7. Move the overflow to ⌘K.`,
            );
        }
    }

    const open = groups.filter((group) => group.defaultOpen !== false).length;
    if (open > 3) {
        console.warn(`[courtprime-shells] "${label}" opens ${open} groups by default; the budget is 3.`);
    }
}
