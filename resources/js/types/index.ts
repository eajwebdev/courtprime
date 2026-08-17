import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
    /** Groups beyond the first three collapse by default, see courtprime-shells. */
    defaultOpen?: boolean;
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Grouping label used by the ⌘K command menu. */
    section?: string;
}

/** Which persona shell renders the authenticated experience. */
export type ShellKind = 'player' | 'owner' | 'operations' | 'cashier' | 'superadmin';

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    workspace?: WorkspaceState;
    navBadges?: Record<string, number>;
    flash?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface WorkspaceOption {
    organization_id: number;
    branch_id: number | null;
    label: string;
    role: string;
    role_label: string;
}

export interface WorkspaceState {
    current: {
        organization_id: number | null;
        organization_name: string | null;
        organization_demo_mode?: boolean;
        branch_id: number | null;
        branch_name: string | null;
        label: string | null;
        role: string | null;
        role_label: string | null;
    };
    available: WorkspaceOption[];
}
