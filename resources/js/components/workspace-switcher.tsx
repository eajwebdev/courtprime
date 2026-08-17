import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

export function WorkspaceSwitcher() {
    const { workspace } = usePage<SharedData>().props;
    const available = workspace?.available ?? [];
    const currentWorkspace = workspace?.current;

    if (!currentWorkspace?.label && available.length === 0) {
        return null;
    }

    const current = workspace?.current?.organization_id ? `${workspace.current.organization_id}:${workspace.current.branch_id ?? ''}` : undefined;

    if (available.length <= 1) {
        return (
            <div className="border-sidebar-border bg-sidebar-accent/40 mx-2 rounded-md border px-3 py-2 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2">
                    <Building2 className="text-sidebar-foreground/70 size-4 shrink-0" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{currentWorkspace?.label ?? 'CourtPrime Workspace'}</p>
                        <p className="text-sidebar-foreground/60 truncate text-xs">{currentWorkspace?.role_label ?? 'Workspace'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 px-2 pb-2 group-data-[collapsible=icon]:hidden">
            <div className="border-sidebar-border bg-sidebar-accent/40 min-w-0 rounded-md border px-3 py-2">
                <p className="truncate text-sm font-medium">{currentWorkspace?.label ?? 'CourtPrime Workspace'}</p>
                <p className="text-sidebar-foreground/60 truncate text-xs">{currentWorkspace?.role_label ?? 'Workspace'}</p>
            </div>
            <Select
                value={current}
                onValueChange={(value) => {
                    const [organizationId, branchId] = value.split(':');

                    router.post(
                        '/workspace',
                        { organization_id: Number(organizationId), branch_id: branchId ? Number(branchId) : null },
                        { preserveScroll: true },
                    );
                }}
            >
                <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                    {available.map((item) => (
                        <SelectItem
                            key={`${item.organization_id}-${item.branch_id ?? 'all'}-${item.role}`}
                            value={`${item.organization_id}:${item.branch_id ?? ''}`}
                        >
                            {item.label} - {item.role_label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
