import { DiscoveryHero } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { currency, friendlyDate, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Phone, Trophy } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- club payload is shaped by
   the existing PublicClubController. */

export default function PublicClub({ club }: { club: any }) {
    const branches: any[] = club.branches ?? [];
    const courts = branches.flatMap((branch: any) => branch.courts ?? []);

    const cheapest = courts.reduce((min: number | null, court: any) => {
        const rate = Number(court.standard_hourly_rate ?? 0);
        return min === null || (rate > 0 && rate < min) ? rate : min;
    }, null);

    return (
        <>
            <Head title={`${club.name} | CourtPrime`}>
                <meta
                    name="description"
                    content={`${club.name} on CourtPrime — branches, courts, hourly rates and public tournaments, bookable with one player identity.`}
                />
            </Head>

            {/*
             * Wrapped in the discovery chrome rather than a bare <main>. This is a
             * public page a visitor can land on from search, and it previously had
             * no navigation of any kind — a wordmark that went nowhere and one
             * button. Now it carries the same header, footer and (for a signed-in
             * player) the same tab bar as every other network page.
             */}
            <DiscoveryPage current="">
                <DiscoveryHero
                    eyebrow="Connected CourtPrime club"
                    title={club.name}
                    description="Every branch, court and tournament at this club."
                    artwork="/cp-model3.png"
                >
                    {/* One action. The header nav already offers every other
                        destination, so a second button here was just navigation
                        wearing a button. */}
                    <Button asChild size="touch" className="mt-5 w-full sm:mt-7 sm:w-auto sm:px-8">
                        <Link href={`/me/book?search=${encodeURIComponent(club.name ?? '')}`}>Book a court</Link>
                    </Button>

                    <p className="text-meta mt-4 text-white/55">
                        <span data-numeric>{branches.length}</span> {branches.length === 1 ? 'branch' : 'branches'} ·{' '}
                        <span data-numeric>{courts.length}</span> {courts.length === 1 ? 'court' : 'courts'}
                        {cheapest !== null && cheapest > 0 && (
                            <>
                                {' '}
                                · from <span data-numeric>{currency(cheapest)}</span> / hour
                            </>
                        )}
                    </p>
                </DiscoveryHero>

                <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.4fr_1fr] lg:px-8">
                    {/* ---- Branches ------------------------------------------- */}
                    <section>
                        <h2 className="text-h2 text-foreground mb-3">Where to play</h2>

                        {branches.length === 0 ? (
                            <EmptyState
                                title="No branches listed yet"
                                description="This club has not published a venue on the network."
                                artwork="/cp-paddle.png"
                                action={
                                    <Button asChild variant="outline">
                                        <Link href="/find-courts">Find another club</Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="space-y-5">
                                {branches.map((branch: any) => {
                                    const hours = branch.operating_hours;
                                    const branchCourts: any[] = branch.courts ?? [];

                                    return (
                                        /* Branch header + divided court rows, the same
                                           shape /find-courts and /me/book use. */
                                        <article key={branch.id} className="border-border bg-surface overflow-hidden rounded-xl border">
                                            <div className="border-border border-b px-4 py-3">
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <h3 className="text-h3 text-foreground min-w-0 truncate">{branch.name}</h3>
                                                    <p className="text-meta text-muted shrink-0">
                                                        <span data-numeric>{branchCourts.length}</span>{' '}
                                                        {branchCourts.length === 1 ? 'court' : 'courts'}
                                                    </p>
                                                </div>

                                                <p className="text-meta text-muted mt-1 flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                                                    <span className="truncate">{branch.address ?? 'Address pending'}</span>
                                                </p>

                                                {/* Hours and phone were in the payload and
                                                    rendered nowhere; on a public club page they
                                                    are the two things a visitor actually wants. */}
                                                <div className="text-meta text-muted mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    {hours?.opens && hours?.closes && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="size-3.5 shrink-0" aria-hidden />
                                                            <span data-numeric>
                                                                {time12h(hours.opens)} – {time12h(hours.closes)}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {branch.phone && (
                                                        <a href={`tel:${branch.phone}`} className="hover:text-foreground flex items-center gap-1.5">
                                                            <Phone className="size-3.5 shrink-0" aria-hidden />
                                                            <span data-numeric>{branch.phone}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <ul className="bg-border grid gap-px sm:grid-cols-2">
                                                {branchCourts.map((court: any) => {
                                                    const bookable = String(court.status) !== 'maintenance';

                                                    return (
                                                        <li className="bg-surface" key={court.id}>
                                                            <Link
                                                                href={`/me/book?court=${court.id}&search=${encodeURIComponent(branch.name ?? '')}`}
                                                                aria-disabled={!bookable}
                                                                className={cn(
                                                                    'block px-4 py-3 transition-colors',
                                                                    bookable ? 'hover:bg-surface-muted' : 'pointer-events-none opacity-60',
                                                                )}
                                                            >
                                                                <div className="flex items-baseline justify-between gap-3">
                                                                    <p className="text-label text-foreground min-w-0 truncate font-semibold">
                                                                        {court.name}
                                                                    </p>
                                                                    <p data-numeric className="text-label text-foreground shrink-0 font-semibold">
                                                                        {currency(court.standard_hourly_rate)}
                                                                        <span className="text-meta text-muted ml-0.5 font-normal">/hr</span>
                                                                    </p>
                                                                </div>

                                                                <div className="mt-1 flex items-center justify-between gap-3">
                                                                    <p className="text-meta text-muted min-w-0 truncate capitalize">
                                                                        {court.court_type} · {court.surface_type}
                                                                    </p>
                                                                    {/* Only when it is not simply open. Five
                                                                        identical "available" pills say nothing. */}
                                                                    {String(court.status) !== 'available' && <StatusBadge status={court.status} />}
                                                                </div>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}

                                                {/* Fills the trailing cell of an odd row so the
                                                    divider colour does not show as a grey slab. */}
                                                {branchCourts.length % 2 === 1 && <li className="bg-surface hidden sm:block" />}
                                            </ul>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ---- Tournaments ---------------------------------------- */}
                    <section>
                        <h2 className="text-h2 text-foreground mb-3 flex items-center gap-2">
                            <Trophy className="text-primary size-5 shrink-0" aria-hidden />
                            Public tournaments
                        </h2>

                        {club.tournaments.length === 0 ? (
                            <p className="border-border text-label text-muted rounded-xl border border-dashed px-5 py-8 text-center">
                                No public tournaments are listed right now.
                            </p>
                        ) : (
                            <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                                {club.tournaments.map((tournament: any) => (
                                    <li key={tournament.id ?? tournament.name} className="px-4 py-3">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className="text-label text-foreground min-w-0 truncate font-semibold">{tournament.name}</p>
                                            <StatusBadge status={tournament.status} />
                                        </div>
                                        <p className="text-meta text-muted mt-1 flex items-center gap-1.5">
                                            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                                            <span className="truncate capitalize">
                                                {friendlyDate(tournament.starts_on)} · {String(tournament.format ?? '').replaceAll('_', ' ')} ·{' '}
                                                <span data-numeric>{currency(tournament.entry_fee)}</span>
                                            </span>
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <Button asChild variant="outline" size="touch" className="mt-3 w-full">
                            <Link href="/find-tournaments">All tournaments on the network</Link>
                        </Button>
                    </section>
                </div>
            </DiscoveryPage>
        </>
    );
}
