import { EquipmentArtwork } from '@/components/marketing-artwork';
import { ScoreboardPortrait, type ScoreboardPlayer } from '@/components/scoreboard/player-portrait';
import { isDefaultPair, ScoreboardTeam } from '@/components/scoreboard/team-portrait';
import { cn } from '@/lib/utils';

export type ScoreboardMatch = {
    id: number;
    team_one_name: string;
    team_two_name: string;
    team_one_score: number;
    team_two_score: number;
    serving_team: string | null;
    serving_number: number | null;
    serve_call: string;
    game_number: number;
    target_score: number;
    match_type: string;
    started_at: string | null;
    team_one: ScoreboardPlayer[];
    team_two: ScoreboardPlayer[];
};

export type ScoreboardCourt = {
    id: number;
    name: string;
    number: number;
    status: string;
    match: ScoreboardMatch | null;
};

/** Minutes since the first serve, for the corner of a live panel. */
function elapsed(startedAt: string | null): string | null {
    if (!startedAt) return null;

    const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);

    if (!Number.isFinite(minutes) || minutes < 0) return null;
    if (minutes < 60) return `${minutes} min`;

    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * One side of a live match.
 *
 * Falls back to the team's name when the match has no rotation behind it:
 * `club_matches` names its teams as free text, and a court scored by hand at
 * the desk has no player records to draw faces from.
 */
function Side({
    players,
    fallbackName,
    tick,
    seed,
    align,
    portraitSize,
}: {
    players: ScoreboardPlayer[];
    fallbackName: string;
    tick: number;
    seed: number;
    align: 'start' | 'end';
    portraitSize: 'md' | 'lg';
}) {
    if (players.length === 0) {
        return (
            <p
                className={cn(
                    'truncate text-[clamp(1rem,2vw,2rem)] font-black tracking-tight uppercase',
                    align === 'end' ? 'text-right' : 'text-left',
                )}
            >
                {fallbackName}
            </p>
        );
    }

    /*
     * A doubles pair with no photos of its own is drawn as one team rather than
     * as two near-identical silhouettes standing next to each other. The moment
     * anybody on the side uploads a picture the side goes back to individual
     * portraits, because a real face outranks stock art.
     */
    if (isDefaultPair(players)) {
        return (
            <div className={cn('flex min-w-0', align === 'end' ? 'justify-end' : 'justify-start')}>
                <ScoreboardTeam players={players} tick={tick} seed={seed} size={portraitSize} className="w-full max-w-[16rem]" />
            </div>
        );
    }

    return (
        <div className={cn('flex min-w-0 flex-wrap gap-3 sm:gap-4', align === 'end' ? 'justify-end' : 'justify-start')}>
            {players.map((player) => (
                <ScoreboardPortrait key={player.id} player={player} tick={tick} size={portraitSize} />
            ))}
        </div>
    );
}

/** The number itself, with the serve dot above the side that holds it. */
function Score({ value, serving, lead }: { value: number; serving: boolean; lead: boolean }) {
    return (
        <div className="flex flex-col items-center">
            <span
                aria-label={serving ? 'Serving' : undefined}
                className={cn('mb-1 size-2 rounded-full sm:size-2.5', serving ? 'bg-primary motion-safe:animate-pulse' : 'bg-transparent')}
            />
            <span
                data-numeric
                aria-live="polite"
                className={cn(
                    'text-[clamp(2.75rem,7vw,8rem)] leading-none font-black tracking-tighter tabular-nums',
                    lead ? 'text-white' : 'text-white/55',
                )}
            >
                {value}
            </span>
        </div>
    );
}

/**
 * One court on the wall board.
 *
 * A live court is the loudest thing on the screen and an idle one deliberately
 * recedes: someone glancing up from the far side of the room needs to find the
 * game, not read an inventory of the building.
 */
export function CourtPanel({ court, tick, dense = false }: { court: ScoreboardCourt; tick: number; dense?: boolean }) {
    const match = court.match;
    const time = match ? elapsed(match.started_at) : null;
    const portraitSize = dense ? 'md' : 'lg';

    if (!match) {
        return (
            <article className="relative flex min-h-[10rem] flex-col justify-between overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="truncate text-[clamp(1rem,1.6vw,1.75rem)] font-black tracking-tight text-white/70 uppercase">{court.name}</h2>
                    <span className="text-[0.6875rem] font-semibold tracking-widest text-white/30 uppercase sm:text-xs">
                        {court.status.replaceAll('_', ' ')}
                    </span>
                </div>

                <p className="text-[clamp(0.875rem,1.2vw,1.125rem)] font-semibold text-white/25">Open</p>

                <EquipmentArtwork
                    asset="/cp-paddle.png"
                    decorative
                    width={220}
                    height={220}
                    sizes="120px"
                    className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-auto opacity-[0.07] sm:h-28"
                />
            </article>
        );
    }

    const progress = Math.min(Math.max(match.team_one_score, match.team_two_score) / Math.max(match.target_score, 1), 1);

    return (
        <article className="relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-5 sm:p-6 xl:p-7">
            {/* A single soft wash so a live panel reads as lit from within,
                rather than as a card with a glow bolted on. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%)',
                }}
            />

            <header className="relative flex items-center justify-between gap-3">
                <h2 className="truncate text-[clamp(1.125rem,1.8vw,2rem)] font-black tracking-tight uppercase">{court.name}</h2>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <span className="text-[0.625rem] font-semibold tracking-widest text-white/40 uppercase sm:text-[0.6875rem]">
                        Game {match.game_number} · to {match.target_score}
                    </span>
                    {time && (
                        <span data-numeric className="text-[0.625rem] font-semibold text-white/40 tabular-nums sm:text-[0.6875rem]">
                            {time}
                        </span>
                    )}
                    <span className="border-live/40 bg-live/10 text-live inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.5625rem] font-bold tracking-widest uppercase sm:px-2.5 sm:text-[0.6875rem]">
                        <span className="relative flex size-1.5 shrink-0" aria-hidden>
                            <span className="bg-live absolute inline-flex size-full rounded-full opacity-70 motion-safe:animate-ping" />
                            <span className="bg-live relative inline-flex size-1.5 rounded-full" />
                        </span>
                        Live
                    </span>
                </div>
            </header>

            {/* Teams flank the score. The centre column is sized by its content
                so the two sides stay symmetric however long the names are. */}
            <div className="relative mt-5 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:mt-6 sm:gap-5">
                {/* Seeds one apart, so the two sides of a panel never show the
                    same stand-in as each other, and consecutive courts are offset
                    too. Not `number * 2 + side`: with two mixed pieces only the
                    parity of the seed decides which one shows, and doubling the
                    court number leaves every second side on the same parity. */}
                <Side
                    players={match.team_one}
                    fallbackName={match.team_one_name}
                    tick={tick}
                    seed={court.number}
                    align="start"
                    portraitSize={portraitSize}
                />

                <div className="flex flex-col items-center gap-2">
                    <div className="border-primary/35 bg-primary/10 text-primary rounded-full border px-3 py-1 text-[0.625rem] font-black tracking-[0.18em] uppercase sm:text-xs">
                        Serve {match.serve_call}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Score
                            value={match.team_one_score}
                            serving={match.serving_team === 'team_one' || match.serving_team === 'one'}
                            lead={match.team_one_score >= match.team_two_score}
                        />
                        <span aria-hidden className="text-[clamp(0.75rem,1vw,1.125rem)] font-black text-white/20">
                            VS
                        </span>
                        <Score
                            value={match.team_two_score}
                            serving={match.serving_team === 'team_two' || match.serving_team === 'two'}
                            lead={match.team_two_score >= match.team_one_score}
                        />
                    </div>
                </div>

                <Side
                    players={match.team_two}
                    fallbackName={match.team_two_name}
                    tick={tick}
                    seed={court.number + 1}
                    align="end"
                    portraitSize={portraitSize}
                />
            </div>

            {/* How close the game is to done, which is the one thing a spectator
                cannot work out from two numbers without knowing the format. */}
            <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-white/10 sm:mt-6">
                <div className="bg-primary h-full rounded-full transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
            </div>
        </article>
    );
}
