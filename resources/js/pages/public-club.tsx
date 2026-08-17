import { AthleteArtwork, BrandWordmark } from '@/components/marketing-artwork';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { currency } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';

export default function PublicClub({ club }: { club: any }) {
    return (
        <>
            <Head title={`${club.name} | CourtPrime`} />
            <main className="min-h-screen bg-slate-950 text-white">
                <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_0.75fr]">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <BrandWordmark variant="onDark" height={12 * 4} className="h-12" priority />
                            {/* Was linking back to /find-courts, which looped the visitor
                                between discovery and this page without ever reaching booking. */}
                            <Button asChild>
                                <Link href={`/me/book?search=${encodeURIComponent(club.name ?? '')}`}>Book a court</Link>
                            </Button>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-pink-300">Connected CourtPrime Club</p>
                            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal md:text-5xl">{club.name}</h1>
                            <p className="mt-4 max-w-2xl text-base text-white/70">
                                Discover branches, courts, public tournaments, and player-facing booking options from the CourtPrime network.
                            </p>
                        </div>
                    </div>
                    <div className="hidden items-end justify-center lg:flex">
                        <AthleteArtwork asset="/cp-model3.png" alt="CourtPrime player profile" className="max-h-[460px] w-full" priority />
                    </div>
                </section>

                <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 md:px-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                        {club.branches.map((branch: any) => (
                            <Card key={branch.id} className="border-white/10 bg-white text-slate-950">
                                <CardContent className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-semibold">{branch.name}</h2>
                                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                                <MapPin className="size-4" />
                                                {branch.address ?? 'Address pending'}
                                            </p>
                                        </div>
                                        <StatusBadge status={branch.code} />
                                    </div>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {branch.courts.map((court: any) => (
                                            <div key={court.id} className="rounded-lg border p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="font-semibold">{court.name}</p>
                                                    <StatusBadge status={court.status} />
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500 capitalize">
                                                    {court.court_type} - {court.surface_type}
                                                </p>
                                                <p className="mt-3 font-semibold">{currency(court.standard_hourly_rate)} / hr</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="border-white/10 bg-white text-slate-950">
                        <CardContent className="space-y-3 p-5">
                            <h2 className="flex items-center gap-2 text-xl font-semibold">
                                <Trophy className="size-5 text-pink-600" />
                                Public Tournaments
                            </h2>
                            {club.tournaments.map((tournament: any) => (
                                <div key={tournament.name} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-semibold">{tournament.name}</p>
                                        <StatusBadge status={tournament.status} />
                                    </div>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="size-4" />
                                        {tournament.starts_on}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500 capitalize">
                                        {tournament.format?.replaceAll('_', ' ')} - {currency(tournament.entry_fee)}
                                    </p>
                                </div>
                            ))}
                            {club.tournaments.length === 0 && (
                                <p className="rounded-lg border p-4 text-sm text-slate-500">No public tournaments are currently listed.</p>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </>
    );
}
