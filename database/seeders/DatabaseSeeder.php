<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\DemoRequest;
use App\Models\Expense;
use App\Models\InventoryMovement;
use App\Models\MaintenanceWorkOrder;
use App\Models\MatchGame;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\OrganizationUserRole;
use App\Models\Payment;
use App\Models\Player;
use App\Models\PlayerProfile;
use App\Models\PlayerRanking;
use App\Models\PosTransaction;
use App\Models\PosTransactionItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Reservation;
use App\Models\ReservationLog;
use App\Models\ScoreEvent;
use App\Models\StaffProfile;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*
         * Founding-owner pricing. `monthly_price` stays the list price; the
         * launch offer lives in metadata so the landing page can show the
         * strike-through without a schema change, and so removing the promo is
         * a data edit rather than a deploy.
         */
        $starter = SubscriptionPlan::query()->updateOrCreate(
            ['code' => 'starter'],
            [
                'name' => 'Starter',
                'description' => 'Everything one location needs to take bookings and get paid.',
                'monthly_price' => 2499,
                'quarterly_price' => 6990,
                'annual_price' => 24990,
                'branch_limit' => 1,
                'court_limit' => 4,
                'staff_limit' => 8,
                'is_active' => true,
                'metadata' => [
                    'promo_price' => 999,
                    'promo_label' => 'Founding club offer',
                    'promo_note' => 'First 50 clubs. Locked for 12 months.',
                    'tagline' => 'For a single club finding its feet.',
                ],
            ],
        );

        $professional = SubscriptionPlan::query()->updateOrCreate(
            ['code' => 'professional'],
            [
                'name' => 'Professional',
                'description' => 'Multi-branch operations with live scoring, memberships and analytics.',
                'monthly_price' => 4999,
                'quarterly_price' => 13990,
                'annual_price' => 49990,
                'branch_limit' => 6,
                'court_limit' => 40,
                'staff_limit' => 80,
                'is_active' => true,
                'metadata' => [
                    'promo_price' => 2499,
                    'promo_label' => 'Founding club offer',
                    'promo_note' => 'First 50 clubs. Locked for 12 months.',
                    'tagline' => 'For clubs running more than one location.',
                    'featured' => true,
                ],
            ],
        );

        $enterprise = SubscriptionPlan::query()->updateOrCreate(
            ['code' => 'enterprise'],
            [
                'name' => 'Enterprise',
                'description' => 'Custom limits, API access, white-label and priority support.',
                'monthly_price' => 9999,
                'quarterly_price' => 27990,
                'annual_price' => 99990,
                'branch_limit' => null,
                'court_limit' => null,
                'staff_limit' => null,
                'is_active' => true,
                'metadata' => [
                    'tagline' => 'For networks that need it their way.',
                ],
            ],
        );

        foreach ([
            [$starter, ['reservations', 'basic_pos', 'players', 'basic_reporting']],
            [$professional, ['reservations', 'pos', 'memberships', 'open_play', 'tournaments', 'live_scoring', 'inventory', 'advanced_analytics']],
            [$enterprise, ['unlimited_branches', 'api_access', 'custom_domain', 'white_label', 'advanced_permissions', 'priority_support']],
        ] as [$plan, $features]) {
            foreach ($features as $feature) {
                $plan->features()->updateOrCreate(
                    ['feature_key' => $feature],
                    ['label' => str($feature)->replace('_', ' ')->headline()->toString(), 'enabled' => true],
                );
            }
        }

        $organization = Organization::query()->updateOrCreate(
            ['slug' => 'eaj-courtprime-club'],
            [
                'name' => 'EAJ CourtPrime Club',
                'owner_name' => 'EAJ Web Development Services',
                'email' => 'operations@courtprime.test',
                'phone' => '+63 900 555 0101',
                'status' => 'active',
                'timezone' => 'Asia/Manila',
                'currency' => 'PHP',
                'demo_mode' => true,
                'settings' => [
                    'booking_interval' => 30,
                    'minimum_booking_minutes' => 60,
                    'cancellation_hours' => 6,
                    'currency_symbol' => 'PHP',
                ],
            ],
        );

        Subscription::query()->updateOrCreate(
            ['organization_id' => $organization->id],
            [
                'subscription_plan_id' => $professional->id,
                'status' => 'active',
                'billing_cycle' => 'monthly',
                'trial_ends_at' => now()->subDays(12),
                'current_period_starts_at' => now()->startOfMonth(),
                'current_period_ends_at' => now()->endOfMonth(),
            ],
        );

        $branches = collect([
            ['name' => 'Bacolod Sports Center', 'code' => 'BAC', 'address' => 'Lacson Street, Bacolod City', 'manager_name' => 'Mia Torres'],
            ['name' => 'Dumaguete Pickleball Hub', 'code' => 'DGT', 'address' => 'Rizal Boulevard, Dumaguete City', 'manager_name' => 'Paolo Reyes'],
            ['name' => 'Cebu Pickle Arena', 'code' => 'CEB', 'address' => 'IT Park, Cebu City', 'manager_name' => 'Kara Lim'],
        ])->map(fn (array $branch) => Branch::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'code' => $branch['code']],
            [
                ...$branch,
                'contact_number' => '+63 917 555 '.fake()->numberBetween(1000, 9999),
                'email' => strtolower($branch['code']).'@eajpickleball.test',
                'status' => 'active',
                'timezone' => 'Asia/Manila',
                'currency' => 'PHP',
                'tax_rate' => 12,
                'operating_hours' => ['opens' => '06:00', 'closes' => '23:00'],
            ],
        ));

        $courts = collect();
        foreach ($branches as $branch) {
            foreach (range(1, $branch->code === 'BAC' ? 4 : 3) as $number) {
                $courts->push(Court::query()->updateOrCreate(
                    ['branch_id' => $branch->id, 'court_number' => $number],
                    [
                        'organization_id' => $organization->id,
                        'name' => $number === 4 ? 'Championship Court' : 'Court '.$number,
                        'court_type' => $number === 4 ? 'championship' : 'standard',
                        'environment' => $number % 2 === 0 ? 'outdoor' : 'indoor',
                        'surface_type' => 'cushioned acrylic',
                        'capacity' => 4,
                        'standard_hourly_rate' => 650,
                        'peak_hourly_rate' => 850,
                        'off_peak_hourly_rate' => 500,
                        'member_hourly_rate' => 520,
                        'guest_hourly_rate' => 700,
                        'amenities' => ['LED lights', 'Score display', 'Benches'],
                        'status' => ['available', 'reserved', 'occupied', 'open_play', 'maintenance'][$number % 5],
                    ],
                ));
            }
        }

        $superadmin = User::query()->updateOrCreate(
            ['email' => 'superadmin@eaj.test'],
            [
                'name' => 'EAJ Superadmin',
                'password' => 'password',
                'role_key' => 'eaj_superadmin',
                'is_superadmin' => true,
                'position' => 'Platform Administrator',
                'email_verified_at' => now(),
            ],
        );

        foreach ([
            ['Owner Demo', 'owner@eaj.test', 'organization_owner', null],
            ['Branch Manager Demo', 'manager@eaj.test', 'branch_manager', $branches->first()->id],
            ['Front Desk Demo', 'frontdesk@eaj.test', 'front_desk', $branches->first()->id],
            ['Cashier Demo', 'cashier@eaj.test', 'cashier', $branches->first()->id],
            ['Scorekeeper Demo', 'scorekeeper@eaj.test', 'scorekeeper', $branches->first()->id],
            ['Tournament Director Demo', 'tournament@eaj.test', 'tournament_director', $branches->first()->id],
        ] as [$name, $email, $role, $branchId]) {
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'organization_id' => $organization->id,
                    'branch_id' => $branchId,
                    'name' => $name,
                    'password' => 'password',
                    'role_key' => $role,
                    'is_superadmin' => false,
                    'position' => str($role)->replace('_', ' ')->headline()->toString(),
                    'email_verified_at' => now(),
                ],
            );

            OrganizationUserRole::query()->withoutGlobalScope('organization')->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'organization_id' => $organization->id,
                    'branch_id' => $branchId,
                    'role_key' => $role,
                ],
                [
                    'status' => 'active',
                    'is_primary' => true,
                ],
            );
        }

        /*
         * Player logins. These are network-level accounts, so they carry no
         * organization_id or branch_id, which is what routes them to the player
         * shell instead of a staff workspace. PlayerProfileResolver issues the
         * CP-PLY identity on first sign-in.
         */
        foreach ([
            ['Juan Santos', 'player1@eaj.test', 'male'],
            ['Maria Cruz', 'player2@eaj.test', 'female'],
            ['Carlo Reyes', 'player3@eaj.test', 'male'],
        ] as [$playerName, $playerEmail, $playerGender]) {
            $playerUser = User::query()->updateOrCreate(
                ['email' => $playerEmail],
                [
                    'organization_id' => null,
                    'branch_id' => null,
                    'name' => $playerName,
                    'password' => 'password',
                    'role_key' => 'player',
                    'is_superadmin' => false,
                    'position' => 'Player',
                    'email_verified_at' => now(),
                ],
            );

            /*
             * Gender drives which athlete artwork the identity card shows. It is
             * set explicitly here rather than inferred from the name, because a
             * name is not a reliable signal and a wrong guess misgenders someone.
             */
            PlayerProfile::query()
                ->where('user_id', $playerUser->id)
                ->update(['gender' => $playerGender]);
        }

        $players = collect([
            ['Juan Santos', 'juan.santos@example.test', 4.21, 'active'],
            ['Maria Cruz', 'maria.cruz@example.test', 3.87, 'active'],
            ['Carlo Reyes', 'carlo.reyes@example.test', 3.62, 'guest'],
            ['Anne Lim', 'anne.lim@example.test', 3.74, 'active'],
            ['Miguel Tan', 'miguel.tan@example.test', 4.05, 'active'],
            ['Sofia Garcia', 'sofia.garcia@example.test', 3.42, 'guest'],
        ])->map(fn (array $player, int $index) => Player::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'email' => $player[1]],
            [
                'name' => $player[0],
                'mobile_number' => '+63 919 555 '.fake()->numberBetween(1000, 9999),
                'emergency_contact' => '+63 918 555 '.fake()->numberBetween(1000, 9999),
                'rating' => $player[2],
                'skill_level' => ['advanced', 'intermediate', 'intermediate', 'intermediate', 'advanced', 'beginner'][$index],
                'membership_status' => $player[3],
                'wallet_balance' => fake()->numberBetween(0, 2500),
                'total_reservations' => fake()->numberBetween(4, 48),
                'last_played_at' => now()->subDays(fake()->numberBetween(0, 18)),
                'preferences' => ['preferred_play' => $index % 2 === 0 ? 'doubles' : 'open_play'],
            ],
        ));

        $playerProfiles = $players->values()->map(function (Player $player, int $index) use ($organization, $branches) {
            $profile = PlayerProfile::query()->updateOrCreate(
                ['courtprime_player_id' => sprintf('CP-PLY-%06d', $index + 1)],
                [
                    'display_name' => $player->name,
                    'first_name' => str($player->name)->before(' ')->toString(),
                    'last_name' => str($player->name)->after(' ')->toString(),
                    'email' => $player->email,
                    'mobile_number' => $player->mobile_number,
                    'home_city' => ['Bacolod', 'Dumaguete', 'Cebu'][$index % 3],
                    'skill_level' => $player->skill_level,
                    'global_rating' => $player->rating,
                    'global_match_count' => 12 + ($index * 3),
                    'wins' => 8 + $index,
                    'losses' => 4 + $index,
                    'verification_status' => $index < 3 ? 'verified' : 'unverified',
                    'status' => 'active',
                    'privacy_settings' => [
                        'show_connected_clubs' => $index < 3,
                        'show_match_history' => true,
                        'show_rating' => true,
                        'show_city' => $index % 2 === 0,
                        'show_achievements' => true,
                    ],
                ],
            );

            OrganizationPlayer::query()->withoutGlobalScope('organization')->updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'player_profile_id' => $profile->id,
                ],
                [
                    'legacy_player_id' => $player->id,
                    'local_player_number' => sprintf('EAJ-%04d', $index + 1),
                    'organization_skill_level' => $player->skill_level,
                    'home_branch_id' => $branches[$index % $branches->count()]->id,
                    'status' => 'active',
                    'wallet_balance' => $player->wallet_balance,
                    'first_visit_at' => now()->subMonths(2),
                    'last_visit_at' => now()->subDays($index),
                    'tags' => ['seeded', $player->membership_status],
                    'preferences' => $player->preferences,
                ],
            );

            return $profile;
        });

        Reservation::query()->where('organization_id', $organization->id)->delete();
        foreach ($courts->take(8) as $index => $court) {
            $startHour = 8 + $index;
            $status = ['confirmed', 'checked_in', 'playing', 'completed'][$index % 4];
            $reservation = Reservation::query()->create([
                'organization_id' => $organization->id,
                'branch_id' => $court->branch_id,
                'court_id' => $court->id,
                'player_id' => $players[$index % $players->count()]->id,
                'reference' => sprintf('RSV-%s-%s-%04d', $court->branch->code, now()->format('Ymd'), $index + 1),
                'reservation_date' => today(),
                'start_time' => sprintf('%02d:00', $startHour),
                'end_time' => sprintf('%02d:30', $startHour + 1),
                'duration_minutes' => 90,
                'players_count' => 4,
                'reservation_type' => $index % 3 === 0 ? 'open_play' : 'court_booking',
                'subtotal' => 975,
                'tax_amount' => 117,
                'amount_due' => 1092,
                'payment_status' => $index % 2 === 0 ? 'paid' : 'partial',
                'booking_status' => $status,
                'source' => ['admin', 'front_desk', 'online'][$index % 3],
                'checked_in_at' => in_array($status, ['checked_in', 'playing', 'completed'], true) ? now()->subMinutes(45 - $index) : null,
                'playing_started_at' => in_array($status, ['playing', 'completed'], true) ? now()->subMinutes(30 - $index) : null,
                'completed_at' => $status === 'completed' ? now()->subMinutes(8) : null,
                'checked_in_by' => $superadmin->id,
                'notes' => 'Seeded demo reservation for operating dashboard.',
            ]);

            ReservationLog::query()->create([
                'organization_id' => $organization->id,
                'reservation_id' => $reservation->id,
                'user_id' => $superadmin->id,
                'action' => 'seeded',
                'message' => 'Demo lifecycle state seeded for Phase 2 operations.',
                'payload' => ['status' => $status],
            ]);
        }

        CourtAvailabilityBlock::query()->updateOrCreate(
            [
                'organization_id' => $organization->id,
                'court_id' => $courts->last()->id,
                'block_date' => today(),
                'start_time' => '13:00',
            ],
            [
                'branch_id' => $courts->last()->branch_id,
                'end_time' => '15:00',
                'reason' => 'maintenance',
                'notes' => 'Surface inspection and net tension check.',
                'created_by' => $superadmin->id,
            ],
        );

        MaintenanceWorkOrder::query()->updateOrCreate(
            ['reference' => 'CP-MNT-SEED-000001'],
            [
                'organization_id' => $organization->id,
                'branch_id' => $courts->last()->branch_id,
                'court_id' => $courts->last()->id,
                'reported_by' => $superadmin->id,
                'assigned_to' => $superadmin->id,
                'title' => 'Surface inspection and net tension check',
                'priority' => 'normal',
                'status' => 'scheduled',
                'scheduled_date' => today(),
                'start_time' => '13:00',
                'end_time' => '15:00',
                'estimated_cost' => 1500,
                'description' => 'Seeded maintenance work order for live operations demo.',
            ],
        );

        ClubMatch::query()->where('organization_id', $organization->id)->delete();
        foreach ($courts->whereIn('status', ['occupied', 'open_play'])->take(3) as $index => $court) {
            $match = ClubMatch::query()->create([
                'organization_id' => $organization->id,
                'branch_id' => $court->branch_id,
                'court_id' => $court->id,
                'match_type' => 'doubles',
                'format' => 'first_to_11_win_by_2',
                'target_score' => 11,
                'win_by_two' => true,
                'scoring_mode' => 'side_out',
                'team_one_name' => $index === 0 ? 'Santos / Cruz' : 'Tan / Garcia',
                'team_two_name' => $index === 0 ? 'Reyes / Lim' : 'Reyes / Cruz',
                'team_one_score' => 8 + $index,
                'team_two_score' => 6 + $index,
                'serving_team' => 'team_one',
                'game_number' => 2,
                'status' => 'live',
                'started_at' => now()->subMinutes(12 + ($index * 5)),
                'scorekeeper_id' => $superadmin->id,
            ]);

            MatchGame::query()->create([
                'organization_id' => $organization->id,
                'club_match_id' => $match->id,
                'game_number' => 2,
                'team_one_score' => $match->team_one_score,
                'team_two_score' => $match->team_two_score,
                'started_at' => $match->started_at,
            ]);

            ScoreEvent::query()->create([
                'organization_id' => $organization->id,
                'club_match_id' => $match->id,
                'recorded_by' => $superadmin->id,
                'event_type' => 'score_increment',
                'team' => 'team_one',
                'team_one_score' => $match->team_one_score,
                'team_two_score' => $match->team_two_score,
                'payload' => ['note' => 'Seed score event for audit reconstruction.'],
            ]);
        }

        OpenPlaySession::query()->where('organization_id', $organization->id)->delete();
        $openPlay = OpenPlaySession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branches->first()->id,
            'name' => 'Saturday Social Open Play',
            'session_date' => today(),
            'start_time' => '19:00',
            'end_time' => '22:00',
            'max_players' => 32,
            'min_rating' => 2.50,
            'max_rating' => 4.50,
            'entry_fee' => 200,
            'status' => 'active',
            'notes' => 'Seeded open play queue for Phase 4.',
        ]);

        foreach ($players as $index => $player) {
            OpenPlayPlayer::query()->create([
                'organization_id' => $organization->id,
                'open_play_session_id' => $openPlay->id,
                'player_id' => $player->id,
                'status' => $index < 4 ? 'checked_in' : 'registered',
                'checked_in_at' => $index < 4 ? now()->subMinutes(20 - $index) : null,
            ]);

            OpenPlayQueueEntry::query()->create([
                'organization_id' => $organization->id,
                'open_play_session_id' => $openPlay->id,
                'player_id' => $player->id,
                'position' => $index + 1,
                'status' => 'waiting',
            ]);
        }

        PlayerRanking::query()->where('organization_id', $organization->id)->delete();
        $players->sortByDesc('rating')->values()->each(function (Player $player, int $index) use ($organization) {
            PlayerRanking::query()->create([
                'organization_id' => $organization->id,
                'player_id' => $player->id,
                'division' => 'club',
                'rank' => $index + 1,
                'rating' => $player->rating,
                'wins' => max((int) floor($player->total_reservations * 0.58), 0),
                'losses' => max((int) floor($player->total_reservations * 0.42), 0),
                'points_for' => $player->total_reservations * 11,
                'points_against' => $player->total_reservations * 8,
                'ranked_at' => now(),
            ]);
        });

        $category = ProductCategory::query()->updateOrCreate(
            ['organization_id' => $organization->id, 'name' => 'Court Essentials'],
        );

        $products = collect([
            ['PB-BALL-001', 'Tournament Ball 3-Pack', 260, 112, 120, 24],
            ['PB-RENT-001', 'Paddle Rental', 150, 0, 32, 6],
            ['DRINK-ION-001', 'Ion Drink', 75, 38, 80, 20],
            ['MERCH-CAP-001', 'EAJ Club Cap', 650, 310, 18, 8],
        ])->map(function (array $product) use ($organization, $category) {
            [$sku, $name, $price, $cost, $stock, $reorder] = $product;

            return Product::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'sku' => $sku],
                [
                    'product_category_id' => $category->id,
                    'barcode' => str($sku)->replace('-', '')->toString(),
                    'name' => $name,
                    'unit' => 'each',
                    'price' => $price,
                    'cost' => $cost,
                    'stock_on_hand' => $stock,
                    'reorder_point' => $reorder,
                    'track_inventory' => $sku !== 'PB-RENT-001',
                    'is_active' => true,
                ],
            );
        });

        $session = CashierSession::query()->updateOrCreate(
            ['reference' => sprintf('TILL-BAC-%s-0001', now()->format('Ymd'))],
            [
                'organization_id' => $organization->id,
                'branch_id' => $branches->first()->id,
                'user_id' => $superadmin->id,
                'status' => 'open',
                'opening_cash' => 3500,
                'expected_cash' => 3500,
                'opened_at' => now()->subHours(5),
            ],
        );

        PosTransactionItem::query()->where('organization_id', $organization->id)->delete();
        Payment::query()->where('organization_id', $organization->id)->delete();
        InventoryMovement::query()->where('organization_id', $organization->id)->delete();
        PosTransaction::query()->where('organization_id', $organization->id)->delete();

        foreach (range(1, 4) as $index) {
            $product = $products[$index % $products->count()];
            $quantity = $index + 1;
            $subtotal = (float) $product->price * $quantity;
            $tax = round($subtotal * 0.12, 2);
            $total = $subtotal + $tax;

            $transaction = PosTransaction::query()->create(
                [
                    'organization_id' => $organization->id,
                    'branch_id' => $branches->first()->id,
                    'cashier_session_id' => $session->id,
                    'user_id' => $superadmin->id,
                    'reference' => sprintf('POS-BAC-%s-%04d', now()->format('Ymd'), $index),
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'discount_amount' => $index === 2 ? 250 : 0,
                    'total_amount' => $index === 2 ? $total - 250 : $total,
                    'amount_tendered' => $index % 2 === 0 ? $total + 500 : $total,
                    'change_due' => $index % 2 === 0 ? 500 : 0,
                    'payment_method' => $index % 2 === 0 ? 'gcash' : 'cash',
                    'status' => 'paid',
                ],
            );

            PosTransactionItem::query()->create([
                'organization_id' => $organization->id,
                'pos_transaction_id' => $transaction->id,
                'product_id' => $product->id,
                'description' => $product->name,
                'quantity' => $quantity,
                'unit_price' => $product->price,
                'line_total' => $subtotal,
            ]);

            Payment::query()->create([
                'organization_id' => $organization->id,
                'branch_id' => $branches->first()->id,
                'pos_transaction_id' => $transaction->id,
                'reference' => sprintf('PAY-BAC-%s-%04d', now()->format('Ymd'), $index),
                'amount' => $transaction->total_amount,
                'method' => $transaction->payment_method,
                'status' => 'paid',
                'received_by' => $superadmin->id,
                'paid_at' => now()->subHours($index),
            ]);

            InventoryMovement::query()->create([
                'organization_id' => $organization->id,
                'branch_id' => $branches->first()->id,
                'product_id' => $product->id,
                'movement_type' => 'sale',
                'quantity' => -$quantity,
                'stock_after' => $product->stock_on_hand,
                'reference_type' => PosTransaction::class,
                'reference_id' => $transaction->id,
                'notes' => 'Seeded POS movement '.$transaction->reference,
                'created_by' => $superadmin->id,
            ]);
        }

        foreach ([
            ['utilities', 'Central Electric Cooperative', 18500, 'bank_transfer', 'paid'],
            ['supplies', 'Court Supplies PH', 6200, 'card', 'approved'],
            ['maintenance', 'NetPro Services', 3500, 'cash', 'pending'],
        ] as [$categoryName, $supplier, $amount, $method, $status]) {
            Expense::query()->updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'supplier' => $supplier,
                ],
                [
                    'branch_id' => $branches->first()->id,
                    'category' => $categoryName,
                    'amount' => $amount,
                    'payment_method' => $method,
                    'expense_date' => today()->subDays(fake()->numberBetween(1, 12)),
                    'receipt_reference' => 'EXP-'.strtoupper(substr($categoryName, 0, 3)).'-001',
                    'status' => $status,
                    'notes' => 'Seeded operating expense for profitability reporting.',
                    'created_by' => $superadmin->id,
                    'approved_by' => in_array($status, ['approved', 'paid'], true) ? $superadmin->id : null,
                    'approved_at' => in_array($status, ['approved', 'paid'], true) ? now() : null,
                ],
            );
        }

        foreach ([
            ['CP-STF-001', 'Mia Torres', $branches->first()->id, 'Operations Manager'],
            ['CP-STF-002', 'Paolo Reyes', $branches->get(1)?->id, 'Branch Manager'],
            ['CP-STF-003', 'Kara Lim', $branches->get(2)?->id, 'Tournament Coordinator'],
        ] as [$employeeId, $staffName, $branchId, $position]) {
            StaffProfile::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'employee_id' => $employeeId],
                [
                    'branch_id' => $branchId,
                    'name' => $staffName,
                    'position' => $position,
                    'contact_email' => str($staffName)->lower()->replace(' ', '.')->append('@courtprime.test')->toString(),
                    'contact_mobile' => '+63 917 555 '.fake()->numberBetween(1000, 9999),
                    'hire_date' => today()->subMonths(8),
                    'status' => 'active',
                ],
            );
        }

        $networkOrganizations = collect([
            ['slug' => 'negros-prime-pickle', 'name' => 'Negros Prime Pickle', 'branches' => [['Dumaguete Pickleball Hub', 'NPP-DGT', 'Rizal Boulevard, Dumaguete City']]],
            ['slug' => 'cebu-pickle-arena', 'name' => 'Cebu Pickle Arena', 'branches' => [['Cebu Central', 'CPA-CEB', 'Cebu Business Park'], ['Mandaue Courts', 'CPA-MND', 'Mandaue City']]],
        ])->map(function (array $tenant, int $tenantIndex) use ($professional, $playerProfiles, $superadmin) {
            $tenantOrganization = Organization::query()->updateOrCreate(
                ['slug' => $tenant['slug']],
                [
                    'name' => $tenant['name'],
                    'owner_name' => $tenant['name'].' Owner',
                    'email' => 'ops@'.$tenant['slug'].'.test',
                    'phone' => '+63 900 555 '.fake()->numberBetween(1000, 9999),
                    'status' => 'active',
                    'timezone' => 'Asia/Manila',
                    'currency' => 'PHP',
                    'demo_mode' => true,
                    'settings' => [
                        'booking_window_days' => 30,
                        'allow_public_booking' => true,
                        'player_privacy_mode' => 'balanced',
                        'primary_color' => $tenantIndex === 0 ? '#1269E8' : '#10B981',
                        'secondary_color' => '#111827',
                        'receipt_footer' => 'Powered by EAJ CourtPrime',
                    ],
                ],
            );

            Subscription::query()->updateOrCreate(
                ['organization_id' => $tenantOrganization->id],
                [
                    'subscription_plan_id' => $professional->id,
                    'status' => 'trial',
                    'billing_cycle' => 'monthly',
                    'trial_ends_at' => now()->addDays(14),
                    'current_period_starts_at' => now()->startOfMonth(),
                    'current_period_ends_at' => now()->endOfMonth(),
                ],
            );

            collect($tenant['branches'])->each(function (array $branchData, int $branchIndex) use ($tenantOrganization, $playerProfiles, $superadmin) {
                [$name, $code, $address] = $branchData;
                $branch = Branch::query()->updateOrCreate(
                    ['organization_id' => $tenantOrganization->id, 'code' => $code],
                    [
                        'name' => $name,
                        'address' => $address,
                        'contact_number' => '+63 917 555 '.fake()->numberBetween(1000, 9999),
                        'email' => strtolower($code).'@courtprime.test',
                        'manager_name' => $tenantOrganization->owner_name,
                        'status' => 'active',
                        'timezone' => 'Asia/Manila',
                        'currency' => 'PHP',
                        'tax_rate' => 12,
                        'operating_hours' => ['opens' => '06:00', 'closes' => '22:00'],
                    ],
                );

                foreach (range(1, 3) as $number) {
                    Court::query()->updateOrCreate(
                        ['branch_id' => $branch->id, 'court_number' => $number],
                        [
                            'organization_id' => $tenantOrganization->id,
                            'name' => 'Court '.$number,
                            'court_type' => 'standard',
                            'environment' => $number % 2 === 0 ? 'outdoor' : 'indoor',
                            'surface_type' => 'cushioned acrylic',
                            'capacity' => 4,
                            'standard_hourly_rate' => 600 + ($number * 50),
                            'peak_hourly_rate' => 800 + ($number * 50),
                            'off_peak_hourly_rate' => 450,
                            'member_hourly_rate' => 500,
                            'guest_hourly_rate' => 700,
                            'amenities' => ['Lights', 'Benches'],
                            'status' => 'available',
                        ],
                    );
                }

                $playerProfiles->take(3)->each(function (PlayerProfile $profile, int $index) use ($tenantOrganization, $branch) {
                    OrganizationPlayer::query()->withoutGlobalScope('organization')->updateOrCreate(
                        [
                            'organization_id' => $tenantOrganization->id,
                            'player_profile_id' => $profile->id,
                        ],
                        [
                            'local_player_number' => sprintf('%s-%04d', $branch->code, $index + 1),
                            'organization_skill_level' => $profile->skill_level,
                            'home_branch_id' => $branch->id,
                            'status' => 'active',
                            'wallet_balance' => 500 + ($index * 250),
                            'first_visit_at' => now()->subMonth(),
                            'last_visit_at' => now()->subDays($index + 1),
                            'tags' => ['cross-club'],
                        ],
                    );
                });

                StaffProfile::query()->updateOrCreate(
                    ['organization_id' => $tenantOrganization->id, 'employee_id' => $branch->code.'-STF-001'],
                    [
                        'branch_id' => $branch->id,
                        'name' => $branch->manager_name,
                        'position' => 'Branch Manager',
                        'contact_email' => $branch->email,
                        'hire_date' => today()->subMonths(5),
                        'status' => 'active',
                    ],
                );
            });

            OrganizationUserRole::query()->withoutGlobalScope('organization')->updateOrCreate(
                [
                    'user_id' => $superadmin->id,
                    'organization_id' => $tenantOrganization->id,
                    'branch_id' => null,
                    'role_key' => 'eaj_superadmin',
                ],
                ['status' => 'active', 'is_primary' => false],
            );

            return $tenantOrganization;
        });

        DemoRequest::query()->updateOrCreate(
            ['email' => 'owner@metro-pickle.test'],
            [
                'reference' => 'DEMO-'.now()->year.'-000001',
                'business_name' => 'Metro Pickle Club',
                'contact_person' => 'Nina Villanueva',
                'mobile_number' => '+63 917 555 2291',
                'website' => 'https://metro-pickle.test',
                'facebook_page' => 'https://facebook.com/metropickle',
                'branches_count' => 3,
                'courts_count' => 14,
                'estimated_members' => 850,
                'estimated_monthly_reservations' => 4200,
                'existing_software' => 'Spreadsheets and group chats',
                'pain_points' => 'Multi-branch scheduling, double bookings, and manual score display updates.',
                'features_needed' => ['Court Reservation', 'POS', 'Live Scoring', 'Tournament', 'Membership'],
                'demo_preference' => 'google_meet',
                'preferred_date' => now()->addDays(3)->toDateString(),
                'preferred_time' => '10:00',
                'notes' => 'Interested in Professional plan with future Enterprise upgrade.',
                'status' => 'new',
            ],
        );
    }
}
