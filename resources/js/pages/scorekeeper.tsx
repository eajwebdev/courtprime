import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { BadgeCheck, Flag, RotateCcw } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Scorekeeper', href: '/matches' }];

export default function Scorekeeper({ match }: { match: any }) {
    const score = (team: 'team_one' | 'team_two') => router.post(`/matches/${match.id}/score`, { team }, { preserveScroll: true });
    const undo = () => router.post(`/matches/${match.id}/undo`, {}, { preserveScroll: true });
    const verifyForm = useForm({});
    const disputeForm = useForm({
        reason: 'score_correction',
        description: '',
    });

    const dispute = (event: FormEvent) => {
        event.preventDefault();
        disputeForm.post(`/matches/${match.id}/disputes`, { preserveScroll: true, onSuccess: () => disputeForm.reset('description') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scorekeeper" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-lg border bg-[#050C20] p-5 text-white">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm text-slate-400">
                                {match.court?.branch?.name} - {match.court?.name}
                            </p>
                            <h1 className="mt-1 text-3xl font-black">Live Scorekeeper</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={match.status} />
                            <StatusBadge status={match.verification_status ?? 'pending'} />
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                        <h2 className="text-xl font-bold">{match.team_one_name}</h2>
                        <span className="text-slate-500">VS</span>
                        <h2 className="text-xl font-bold">{match.team_two_name}</h2>
                        <button
                            disabled={match.status === 'completed'}
                            onClick={() => score('team_one')}
                            className="rounded-lg bg-white/10 p-8 transition hover:bg-white/15 disabled:opacity-50"
                        >
                            <span className="block text-7xl font-black text-[#FF1F64]">{match.team_one_score}</span>
                            <span className="mt-3 block text-sm text-slate-300 uppercase">Add Point</span>
                        </button>
                        <div className="text-sm text-slate-400">
                            <p>Game {match.game_number}</p>
                            <p>First to {match.target_score}</p>
                            <p>{match.win_by_two ? 'Win by 2' : 'No win by 2'}</p>
                        </div>
                        <button
                            disabled={match.status === 'completed'}
                            onClick={() => score('team_two')}
                            className="rounded-lg bg-white/10 p-8 transition hover:bg-white/15 disabled:opacity-50"
                        >
                            <span className="block text-7xl font-black">{match.team_two_score}</span>
                            <span className="mt-3 block text-sm text-slate-300 uppercase">Add Point</span>
                        </button>
                    </div>
                    <div className="mt-6 flex justify-center">
                        <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={undo}>
                            <RotateCcw className="size-4" />
                            Undo Last Point
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Score Events</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {match.score_events.map((event: any) => (
                                <div key={event.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                                    <div>
                                        <p className="font-semibold">{event.event_type.replaceAll('_', ' ')}</p>
                                        <p className="text-muted-foreground">{event.team ?? 'system'}</p>
                                    </div>
                                    <strong>
                                        {event.team_one_score} - {event.team_two_score}
                                    </strong>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Games</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {match.games.map((game: any) => (
                                <div key={game.id} className="rounded-lg border p-3">
                                    <div className="flex justify-between">
                                        <p className="font-semibold">Game {game.game_number}</p>
                                        <StatusBadge status={game.winner_team ?? 'live'} />
                                    </div>
                                    <p className="mt-3 text-2xl font-black">
                                        {game.team_one_score} - {game.team_two_score}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.8fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BadgeCheck className="size-4 text-pink-600" />
                                Match Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-3">
                                <p className="text-muted-foreground text-sm">Current Status</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <StatusBadge status={match.status} />
                                    <StatusBadge status={match.verification_status ?? 'pending'} />
                                </div>
                            </div>
                            <Button
                                disabled={match.status !== 'completed' || verifyForm.processing}
                                onClick={() => verifyForm.post(`/matches/${match.id}/verify`, { preserveScroll: true })}
                            >
                                <BadgeCheck className="size-4" />
                                Verify Final Score
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Flag className="size-4 text-pink-600" />
                                Disputes & Corrections
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={dispute} className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm capitalize"
                                        value={disputeForm.data.reason}
                                        onChange={(event) => disputeForm.setData('reason', event.target.value)}
                                    >
                                        {['score_correction', 'wrong_players', 'wrong_court', 'duplicate_match', 'other'].map((reason) => (
                                            <option key={reason} value={reason}>
                                                {reason.replaceAll('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <textarea
                                        className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                        value={disputeForm.data.description}
                                        onChange={(event) => disputeForm.setData('description', event.target.value)}
                                    />
                                    {disputeForm.errors.description && <p className="text-xs text-red-600">{disputeForm.errors.description}</p>}
                                </div>
                                <Button disabled={disputeForm.processing}>Submit Dispute</Button>
                            </form>

                            <div className="space-y-3">
                                {(match.disputes ?? []).map((dispute: any) => (
                                    <div key={dispute.id} className="rounded-lg border p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap gap-2">
                                                <StatusBadge status={dispute.reason} />
                                                <StatusBadge status={dispute.status} />
                                            </div>
                                            <p className="text-muted-foreground">{dispute.reporter?.name ?? 'CourtPrime user'}</p>
                                        </div>
                                        <p className="mt-3">{dispute.description}</p>
                                    </div>
                                ))}
                                {(match.disputes ?? []).length === 0 && (
                                    <p className="text-muted-foreground text-sm">No disputes submitted for this match.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
