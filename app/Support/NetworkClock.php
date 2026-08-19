<?php

namespace App\Support;

use App\Models\Organization;
use Carbon\CarbonImmutable;
use DateTimeZone;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * "Today" for public, tenant-less pages.
 *
 * `config('app.timezone')` is UTC while the clubs run on Asia/Manila, so a bare
 * `today()` returns the previous day for the first eight hours of every local
 * morning. Discovery and booking pages defaulted their date filter that way,
 * which is why the results header read "Yesterday".
 *
 * BranchClock already solves this inside a tenant. This is the equivalent for
 * requests that have no tenant context yet: it falls back to the network's own
 * organisations rather than to UTC.
 */
class NetworkClock
{
    public static function timezone(): string
    {
        $timezone = Cache::remember('network.timezone', now()->addHour(), function (): ?string {
            return Organization::query()
                ->withoutGlobalScope('organization')
                ->whereNotNull('timezone')
                ->value('timezone');
        });

        if (! $timezone) {
            return config('app.timezone', 'UTC');
        }

        try {
            new DateTimeZone($timezone);

            return $timezone;
        } catch (Throwable) {
            return config('app.timezone', 'UTC');
        }
    }

    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::timezone());
    }

    public static function today(): string
    {
        return self::now()->toDateString();
    }

    /**
     * The earliest day a player may book: tomorrow, never today.
     *
     * Same-day bookings are the club's to take at the desk, not the network's
     * to hand out — a court that shows free at 6pm on a public grid may already
     * have someone walking in for it, and a booking made an hour ahead leaves no
     * time to tell anyone. A day of notice is what makes the grid trustworthy.
     *
     * The club's own timezone decides when tomorrow starts, not UTC.
     */
    public static function firstBookableDate(): string
    {
        return self::now()->addDay()->toDateString();
    }
}
