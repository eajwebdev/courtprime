import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { type NavGroup, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    return (
        <>
            {groups.map((group) => (
                <NavGroupSection key={group.title} group={group} />
            ))}
        </>
    );
}

function NavGroupSection({ group }: { group: NavGroup }) {
    const page = usePage<SharedData>();
    const badges = page.props.navBadges ?? {};

    const containsCurrent = group.items.some((item) => page.url.startsWith(item.url));
    const [open, setOpen] = useState(group.defaultOpen !== false || containsCurrent);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:text-sidebar-accent-foreground flex w-full items-center justify-between rounded-md transition-colors">
                        {group.title}
                        <ChevronRight className={cn('size-3.5 transition-transform duration-200', open && 'rotate-90')} />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={page.url.startsWith(item.url)} tooltip={item.title}>
                                    <Link href={item.url} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        {badges[item.url] > 0 && (
                                            <span
                                                data-numeric
                                                className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold"
                                            >
                                                {badges[item.url]}
                                            </span>
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}
