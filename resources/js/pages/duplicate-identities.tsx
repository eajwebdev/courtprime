import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Duplicate Review', href: '/duplicate-identities' }];

export default function DuplicateIdentities({ groups, metrics }: { groups: any[]; metrics: Record<string, number> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Duplicate Identity Review" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <p className="text-sm font-semibold text-pink-600">Global Player Identity</p>
                    <h1 className="mt-2 text-2xl font-semibold">Duplicate Review</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Review possible duplicate CourtPrime identities by shared verified identifiers.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Metric icon={Search} label="Review Groups" value={metrics.groups} />
                    <Metric icon={Users} label="Profiles Flagged" value={metrics.profiles} />
                </div>

                <div className="space-y-4">
                    {groups.map((group) => (
                        <Card key={`${group.type}-${group.value}`}>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {group.type}: {group.value}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                {group.profiles.map((profile: any) => (
                                    <div key={profile.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold">{profile.display_name}</p>
                                                <StatusBadge status={profile.verification_status} />
                                            </div>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {profile.courtprime_player_id} - {profile.email ?? 'No email'} -{' '}
                                                {profile.mobile_number ?? 'No mobile'}
                                            </p>
                                            {profile.organizations.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {profile.organizations.map((organization: string) => (
                                                        <span
                                                            key={organization}
                                                            className="bg-surface-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs"
                                                        >
                                                            {organization}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-semibold">{profile.global_rating ?? '-'}</p>
                                            <p className="text-muted-foreground">Rating</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    {groups.length === 0 && (
                        <Card>
                            <CardContent className="text-muted-foreground p-6 text-sm">
                                No possible duplicate CourtPrime identities were found by email or mobile number.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="p-4">
                <Icon className="size-4 text-pink-600" />
                <p className="text-muted-foreground mt-2 text-sm">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
