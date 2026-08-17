import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Medal, TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Rankings', href: '/rankings' }];

export default function Rankings({ globalRankings = [], clubRankings = [] }: { globalRankings: any[]; clubRankings: any[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rankings" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Player Rankings</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Global CourtPrime and organization rankings from verified player identity records.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">CourtPrime Global Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {globalRankings.map((ranking) => (
                            <div
                                key={ranking.courtprime_player_id}
                                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[auto_1fr_auto_auto_auto] md:items-center"
                            >
                                <RankMark rank={ranking.rank} />
                                <div>
                                    <p className="font-semibold">{ranking.display_name}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {ranking.courtprime_player_id} - {ranking.matches} verified matches
                                    </p>
                                </div>
                                <StatusBadge status={ranking.skill_level ?? 'open'} />
                                <StatusBadge status={ranking.verification_status} />
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-2 text-lg font-black">
                                        <TrendingUp className="size-4 text-pink-600" />
                                        {ranking.rating}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {ranking.wins}W / {ranking.losses}L - {ranking.win_percent}%
                                    </p>
                                </div>
                            </div>
                        ))}
                        {globalRankings.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">No global rankings are available yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Organization Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {clubRankings.map((ranking) => (
                            <div key={ranking.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
                                <RankMark rank={ranking.rank} />
                                <div>
                                    <p className="font-semibold">{ranking.player?.name}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {ranking.wins} wins - {ranking.losses} losses
                                    </p>
                                </div>
                                <StatusBadge status={ranking.division} />
                                <div className="flex items-center justify-end gap-2 text-lg font-black">
                                    <TrendingUp className="size-4 text-pink-600" />
                                    {ranking.rating}
                                </div>
                            </div>
                        ))}
                        {clubRankings.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">
                                No organization rankings are available in this workspace yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function RankMark({ rank }: { rank: number }) {
    return (
        <div className="flex size-12 items-center justify-center rounded-lg bg-pink-50 text-xl font-black text-pink-600 dark:bg-pink-400/10">
            {rank <= 3 ? <Medal className="size-6" /> : rank}
        </div>
    );
}
