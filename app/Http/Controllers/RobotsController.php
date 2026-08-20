<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

/**
 * robots.txt, served by the app so the sitemap line carries whatever domain
 * this deployment actually runs on rather than one baked into a static file.
 *
 * CourtPrime is mostly a private workspace, so the rule is closed by default:
 * everything is disallowed and the handful of genuinely public pages are
 * allowed back by name. A new admin route added tomorrow is blocked without
 * anyone remembering to block it.
 *
 * The asset allowances are not optional. Google renders the page before it
 * judges it, and a crawler that cannot fetch the stylesheet and the Inertia
 * bundle sees an unstyled shell.
 */
class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $lines = [
            'User-agent: *',
            'Disallow: /',
            '',
            '# Public pages',
            'Allow: /$',
            'Allow: /find-courts',
            'Allow: /find-open-play',
            'Allow: /find-tournaments',
            'Allow: /leaderboards',
            'Allow: /clubs/',
            'Allow: /request-demo',
            'Allow: /privacy-policy',
            'Allow: /terms-of-service',
            '',
            '# Assets needed to render those pages',
            'Allow: /build/',
            'Allow: /storage/',
            'Allow: /favicon.ico',
            'Allow: /manifest.webmanifest',
            'Allow: /*.css$',
            'Allow: /*.js$',
            'Allow: /*.png$',
            'Allow: /*.jpg$',
            'Allow: /*.svg$',
            'Allow: /*.webp$',
            '',
            'Sitemap: '.url('/sitemap.xml'),
            '',
        ];

        return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
