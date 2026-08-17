import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Platform Audit', href: '/platform-audit' }];

export default function PlatformAudit({ logs }: { logs: any }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Audit" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <p className="text-sm font-semibold text-pink-600">EAJ Superadmin</p>
                    <h1 className="mt-2 text-2xl font-semibold">Platform Audit</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Privileged CourtPrime access, tenant mutations, route model snapshots, IP, and device records.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="size-4 text-pink-600" />
                            Recent Audit Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {logs.data.map((log: any) => (
                            <div key={log.id} className="grid gap-3 rounded-lg border p-4 text-sm lg:grid-cols-[1fr_auto_auto] lg:items-center">
                                <div>
                                    <p className="font-semibold">{log.action}</p>
                                    <p className="text-muted-foreground mt-1">
                                        {log.user?.name ?? 'Unknown user'} - {log.organization?.name ?? 'No tenant'} - {log.path}
                                    </p>
                                    {log.auditable_type && (
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {log.auditable_type} #{log.auditable_id}
                                        </p>
                                    )}
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {log.occurred_at} - {log.ip_address ?? 'No IP'}
                                    </p>
                                </div>
                                <StatusBadge status={log.method} />
                                <StatusBadge status={String(log.metadata?.status_code ?? 'logged')} />
                            </div>
                        ))}
                        {logs.data.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">No platform audit events have been recorded yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
