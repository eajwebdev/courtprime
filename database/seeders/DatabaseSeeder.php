<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seed the application's database.
 *
 * Defaults only: the platform plans and operator login, and the club partners
 * on the network — CourtPrime Demo, two branches, three courts each.
 *
 * No players. They arrive by registering or by being added at the desk, and a
 * roster of invented people made every player screen look populated when the
 * club has nobody yet. Nothing transactional either: no reservations, matches,
 * open play sessions, sales, payments, expenses or rankings, so a fresh install
 * opens on real empty states rather than on a day of invented business.
 *
 * Each seeder below is also runnable on its own — `php artisan db:seed --class=ClubPartnerSeeder`
 * — because each pulls in what it depends on with `callOnce`.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SubscriptionPlanSeeder::class,
            PlatformAdminSeeder::class,
            ClubPartnerSeeder::class,
        ]);
    }
}
