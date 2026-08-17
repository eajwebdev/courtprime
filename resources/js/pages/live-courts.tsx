import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { MonitorUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Live Courts', href: '/live-courts' }];

export default function LiveCourts({ courts }: { courts: any[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Live Courts" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Live Court Management</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Operational view for current matches, court status, score state, and next activity.
                        </p>
                    </div>
                    <Link href="/display/live" className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium">
                        <MonitorUp className="size-4" />
                        TV Display
                    </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {courts.map((court) => {
                        const match = court.matches?.[0];

                        return (
                            <Card key={court.id} className={match ? 'border-pink-200 shadow-pink-100' : ''}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-xs font-semibold uppercase">{court.branch?.name}</p>
                                            <h2 className="mt-1 text-2xl font-semibold">{court.name}</h2>
                                        </div>
                                        <StatusBadge status={match ? 'live' : court.status} />
                                    </div>
                                    {match ? (
                                        <div className="mt-8">
                                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                                                <strong>{match.team_one_name}</strong>
                                                <span className="text-muted-foreground text-xs">VS</span>
                                                <strong>{match.team_two_name}</strong>
                                                <span className="text-5xl font-black text-pink-600">{match.team_one_score}</span>
                                                <span />
                                                <span className="text-5xl font-black">{match.team_two_score}</span>
                                            </div>
                                            <p className="text-muted-foreground mt-5 text-center text-sm">Game {match.game_number}</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground mt-8 text-sm">
                                            No live match assigned. Court is ready for schedule updates.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
