<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * The sitemap search engines fetch.
 *
 * Every URL here is a page that is public, useful on its own, and marked
 * indexable by App\Support\Seo. Nothing behind auth, no session board, no
 * courtside display and no personal profile: a sitemap that lists pages a
 * crawler cannot use costs crawl budget and teaches nothing.
 *
 * Club pages come from the network itself, so a club that goes live becomes
 * discoverable without anyone editing a file.
 */
class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('sitemap.xml', now()->addHour(), fn (): string => $this->build());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function build(): string
    {
        $urls = [
            ['loc' => rtrim(url('/'), '/').'/', 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => route('courts.discovery'), 'changefreq' => 'daily', 'priority' => '0.9'],
            ['loc' => route('open-play.discovery'), 'changefreq' => 'daily', 'priority' => '0.8'],
            ['loc' => route('tournaments.discovery'), 'changefreq' => 'daily', 'priority' => '0.8'],
            ['loc' => route('rankings.public'), 'changefreq' => 'daily', 'priority' => '0.8'],
            ['loc' => route('demo.create'), 'changefreq' => 'monthly', 'priority' => '0.7'],
            ['loc' => route('privacy'), 'changefreq' => 'yearly', 'priority' => '0.3'],
            ['loc' => route('terms'), 'changefreq' => 'yearly', 'priority' => '0.3'],
        ];

        Organization::query()
            ->withoutGlobalScope('organization')
            ->whereIn('status', ['trial', 'active'])
            ->whereNotNull('slug')
            ->get(['slug', 'updated_at'])
            ->each(function (Organization $organization) use (&$urls): void {
                $urls[] = [
                    'loc' => route('clubs.public.show', $organization->slug),
                    'lastmod' => $organization->updated_at instanceof Carbon
                        ? $organization->updated_at->toAtomString()
                        : null,
                    'changefreq' => 'weekly',
                    'priority' => '0.7',
                ];
            });

        $body = collect($urls)
            ->map(function (array $url): string {
                $lines = ['        <loc>'.e($url['loc']).'</loc>'];

                if (! empty($url['lastmod'])) {
                    $lines[] = '        <lastmod>'.$url['lastmod'].'</lastmod>';
                }

                $lines[] = '        <changefreq>'.$url['changefreq'].'</changefreq>';
                $lines[] = '        <priority>'.$url['priority'].'</priority>';

                return "    <url>\n".implode("\n", $lines)."\n    </url>";
            })
            ->implode("\n");

        return '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .$body."\n"
            .'</urlset>'."\n";
    }
}
