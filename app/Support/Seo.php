<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * Server-rendered search metadata.
 *
 * Inertia builds the page in the browser, so anything a page puts in <Head>
 * only exists after JavaScript runs. Crawlers read the first response, and the
 * ones that never render JS (most social unfurlers, several search engines)
 * would see an empty document. So the title, description, canonical, social
 * card and structured data are all resolved here and printed into the HTML the
 * server sends.
 *
 * A route is listed below or it is not indexed. Everything behind auth, every
 * courtside display, every session board and every personal profile is noise in
 * a search index at best and a privacy leak at worst, so the default is
 * noindex and public pages opt in by name.
 *
 * A controller can override any key by passing an `seo` prop to
 * Inertia::render, which is how pages with per-record titles (a club page) get
 * their own.
 */
class Seo
{
    public const SITE_NAME = 'CourtPrime';

    public const LEGAL_NAME = 'EAJ CourtPrime';

    private const DEFAULT_DESCRIPTION = 'CourtPrime is the pickleball club operating system and player network: one verified player identity across every connected court, with reservations, memberships, POS, tournaments and live scoring for club owners.';

    /**
     * Public pages, keyed by route name. Anything absent is noindex.
     *
     * @return array<string, array{title: string, description: string}>
     */
    private static function indexable(): array
    {
        return [
            'home' => [
                'title' => 'CourtPrime — Pickleball Club Software & Player Network',
                'description' => self::DEFAULT_DESCRIPTION,
            ],
            'courts.discovery' => [
                'title' => 'Find Pickleball Courts Near You | CourtPrime',
                'description' => 'Search connected CourtPrime clubs, compare available courts and hourly rates, and book your next game with one player identity.',
            ],
            'open-play.discovery' => [
                'title' => 'Find Pickleball Open Play Sessions | CourtPrime',
                'description' => 'See which CourtPrime clubs have open play running today, how many spots are left, and join the queue with your player identity.',
            ],
            'tournaments.discovery' => [
                'title' => 'Find Pickleball Tournaments | CourtPrime',
                'description' => 'Browse upcoming pickleball tournaments across the CourtPrime network, check divisions and entry fees, and register online.',
            ],
            'rankings.public' => [
                'title' => 'Pickleball Leaderboards & Player Rankings | CourtPrime',
                'description' => 'Global CourtPrime rankings built from verified match records across every connected club. One record that follows the player everywhere.',
            ],
            'clubs.public.show' => [
                'title' => 'Pickleball Club | CourtPrime',
                'description' => 'Courts, hourly rates, open play and tournaments at a club on the CourtPrime network.',
            ],
            'demo.create' => [
                'title' => 'Request a CourtPrime Demo | Pickleball Club Software',
                'description' => 'See how CourtPrime runs a pickleball club: reservations, courts, memberships, POS, staff, tournaments and live scoring in one system.',
            ],
            'privacy' => [
                'title' => 'Privacy Policy | CourtPrime',
                'description' => 'How CourtPrime handles player identity, club business records and operational data across the network.',
            ],
            'terms' => [
                'title' => 'Terms of Service | CourtPrime',
                'description' => 'The terms covering use of the CourtPrime platform by pickleball organizations, staff and players.',
            ],
        ];
    }

    /**
     * Resolve everything the head partial needs for this request.
     *
     * @param  array<string, mixed>  $page  the Inertia page object
     * @return array{title: string, description: string, canonical: string, image: string, index: bool, schema: array<int, array<string, mixed>>}
     */
    public static function resolve(Request $request, array $page = []): array
    {
        $name = (string) ($request->route()?->getName() ?? '');
        $entry = self::indexable()[$name] ?? null;

        /* A controller's `seo` prop wins over the table, so a club page can
           name the club it is actually showing. */
        $override = Arr::get($page, 'props.seo');
        $override = is_array($override) ? $override : [];

        /* A filtered discovery URL is the same page with a search term in it.
           It stays crawlable and points at the clean version; only the clean
           version asks to be indexed. */
        $index = $entry !== null && $request->getQueryString() === null;

        return [
            'title' => self::clean($override['title'] ?? $entry['title'] ?? self::SITE_NAME.' — Pickleball Club Software & Player Network', 70),
            'description' => self::clean($override['description'] ?? $entry['description'] ?? self::DEFAULT_DESCRIPTION, 320),
            'canonical' => self::canonical($request, $override['canonical'] ?? null),
            'image' => url($override['image'] ?? '/cp-og.png'),
            'index' => (bool) ($override['index'] ?? $index),
            'schema' => $override['schema'] ?? ($name === 'home' ? self::homeSchema() : []),
        ];
    }

    /**
     * The canonical URL, without the query string.
     *
     * Discovery pages take a search term and a date, so the same courts are
     * reachable through an unbounded number of URLs. They all point at the
     * clean one.
     */
    private static function canonical(Request $request, ?string $override): string
    {
        if ($override !== null) {
            return url($override);
        }

        $path = trim($request->path(), '/');

        return $path === '' ? rtrim(url('/'), '/').'/' : url($path);
    }

    private static function clean(string $value, int $limit): string
    {
        return Str::limit(trim(preg_replace('/\s+/', ' ', $value) ?? $value), $limit, '');
    }

    /**
     * Homepage structured data.
     *
     * The Organization block is what a search engine uses to treat CourtPrime
     * as a named thing rather than a word on a page, which is the difference
     * between ranking for the brand and competing for it. WebSite carries the
     * search box; SoftwareApplication states the category.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function homeSchema(): array
    {
        $url = rtrim(url('/'), '/').'/';

        return [
            [
                '@context' => 'https://schema.org',
                '@type' => 'Organization',
                '@id' => $url.'#organization',
                'name' => self::SITE_NAME,
                'alternateName' => [self::LEGAL_NAME, 'Court Prime'],
                'url' => $url,
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => url('/cp.png'),
                    'width' => 1254,
                    'height' => 1254,
                ],
                'image' => url('/cp-og.png'),
                'description' => self::DEFAULT_DESCRIPTION,
            ],
            [
                '@context' => 'https://schema.org',
                '@type' => 'WebSite',
                '@id' => $url.'#website',
                'name' => self::SITE_NAME,
                'alternateName' => self::LEGAL_NAME,
                'url' => $url,
                'publisher' => ['@id' => $url.'#organization'],
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => [
                        '@type' => 'EntryPoint',
                        'urlTemplate' => url('/find-courts').'?search={search_term_string}',
                    ],
                    'query-input' => 'required name=search_term_string',
                ],
            ],
            [
                '@context' => 'https://schema.org',
                '@type' => 'SoftwareApplication',
                'name' => self::SITE_NAME,
                'applicationCategory' => 'BusinessApplication',
                'applicationSubCategory' => 'Pickleball club management software',
                'operatingSystem' => 'Web browser',
                'url' => $url,
                'publisher' => ['@id' => $url.'#organization'],
                'description' => self::DEFAULT_DESCRIPTION,
                'featureList' => [
                    'Court reservations and scheduling',
                    'Open play queues and paddle stack rotation',
                    'Memberships and player wallets',
                    'Point of sale and inventory',
                    'Tournament management and brackets',
                    'Live scoring and courtside displays',
                    'Cross-club player identity and rankings',
                ],
            ],
        ];
    }
}
