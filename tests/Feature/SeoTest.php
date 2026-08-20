<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * What a crawler receives.
 *
 * Everything here is asserted against the raw response body, never against the
 * rendered page, because that is exactly the difference these tests exist to
 * protect: Inertia builds the head in the browser, and a search engine that
 * runs no JavaScript only ever sees what the server printed.
 */
class SeoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::forget('sitemap.xml');
        Cache::forget('landing.network_stats');
        Cache::forget('landing.network_clubs');
    }

    private function club(string $name, string $slug): Organization
    {
        $organization = Organization::query()->create([
            'name' => $name,
            'slug' => $slug,
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => $name.' Main',
            'code' => 'HP-MAIN',
            'address' => '12 Rizal Boulevard, Dumaguete',
            'status' => 'active',
        ]);

        return $organization;
    }

    public function test_home_is_indexable_and_describes_itself_in_the_first_response(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('<title inertia>CourtPrime', false);
        $response->assertSee('name="description"', false);
        $response->assertSee('rel="canonical"', false);
        $response->assertSee('index, follow', false);
        $response->assertSee('og:image', false);
        $response->assertSee('"@type":"Organization"', false);
        $response->assertSee('"@type":"WebSite"', false);
        $response->assertSee('SearchAction', false);
    }

    public function test_pages_that_are_not_public_ask_not_to_be_indexed(): void
    {
        $this->get('/login')->assertSee('noindex, nofollow', false);
    }

    /**
     * A filtered discovery URL is the same page with a search term in it. It
     * points back at the clean one instead of competing with it.
     */
    public function test_a_filtered_discovery_url_is_canonicalised_and_not_indexed(): void
    {
        $response = $this->get('/find-courts?search=dumaguete');

        $response->assertOk();
        $response->assertSee('rel="canonical" href="'.url('/find-courts').'"', false);
        $response->assertSee('noindex, nofollow', false);

        $this->get('/find-courts')->assertSee('index, follow', false);
    }

    public function test_a_club_page_names_the_club_and_publishes_it_as_a_place(): void
    {
        $this->club('Harborline Pickleball', 'harborline-pickleball');

        $response = $this->get('/clubs/harborline-pickleball');

        $response->assertOk();
        $response->assertSee('Harborline Pickleball in Dumaguete', false);
        $response->assertSee('"@type":"SportsOrganization"', false);
        $response->assertSee('SportsActivityLocation', false);
    }

    public function test_the_sitemap_lists_public_pages_and_live_clubs(): void
    {
        $organization = $this->club('Harborline Pickleball', 'harborline-pickleball');

        Organization::query()->create([
            'name' => 'Never Launched',
            'slug' => 'never-launched',
            'status' => 'cancelled',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $response->assertSee(route('courts.discovery'), false);
        $response->assertSee(route('rankings.public'), false);
        $response->assertSee(route('clubs.public.show', $organization->slug), false);

        /* A club that is not on the network is not a page, so it is not a URL. */
        $response->assertDontSee('never-launched', false);
    }

    public function test_robots_closes_the_workspace_and_points_at_the_sitemap(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk();
        $response->assertSee('Disallow: /', false);
        $response->assertSee('Allow: /find-courts', false);
        $response->assertSee('Sitemap: '.url('/sitemap.xml'), false);

        /* Google renders before it ranks. Blocking the bundle would hand it an
           unstyled shell. */
        $response->assertSee('Allow: /build/', false);
    }
}
