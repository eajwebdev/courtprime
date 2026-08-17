<?php

namespace App\Providers;

use App\Models\Organization;
use App\Models\AccountReceivable;
use App\Models\ActivityTimelineEvent;
use App\Models\ApiCredential;
use App\Models\Announcement;
use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\ClubMatch;
use App\Models\Coach;
use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\CrmNote;
use App\Models\Expense;
use App\Models\InventoryMovement;
use App\Models\MaintenanceWorkOrder;
use App\Models\MatchGame;
use App\Models\MatchDispute;
use App\Models\MembershipPlan;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\OrganizationPlayer;
use App\Models\OrganizationUserRole;
use App\Models\Payment;
use App\Models\Player;
use App\Models\PlayerMembership;
use App\Models\PlayerRanking;
use App\Models\PlayerRatingHistory;
use App\Models\PlayerWaiver;
use App\Models\PosTransaction;
use App\Models\PosTransactionItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Reservation;
use App\Models\ReservationLog;
use App\Models\Refund;
use App\Models\ScoreEvent;
use App\Models\StaffAttendanceEntry;
use App\Models\StaffProfile;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPayment;
use App\Models\Tournament;
use App\Models\TournamentBracketMatch;
use App\Models\TournamentDivision;
use App\Models\TournamentRegistration;
use App\Models\WaiverTemplate;
use App\Policies\OrganizationPolicy;
use App\Policies\TenantResourcePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Organization::class, OrganizationPolicy::class);

        foreach ([
            AccountReceivable::class,
            ActivityTimelineEvent::class,
            ApiCredential::class,
            Announcement::class,
            Branch::class,
            CashierSession::class,
            ClubMatch::class,
            Coach::class,
            Court::class,
            CourtAvailabilityBlock::class,
            CrmNote::class,
            Expense::class,
            InventoryMovement::class,
            MaintenanceWorkOrder::class,
            MatchGame::class,
            MatchDispute::class,
            MembershipPlan::class,
            OpenPlayPlayer::class,
            OpenPlayQueueEntry::class,
            OpenPlaySession::class,
            OrganizationPlayer::class,
            OrganizationUserRole::class,
            Payment::class,
            Player::class,
            PlayerMembership::class,
            PlayerRanking::class,
            PlayerRatingHistory::class,
            PlayerWaiver::class,
            PosTransaction::class,
            PosTransactionItem::class,
            Product::class,
            ProductCategory::class,
            Reservation::class,
            ReservationLog::class,
            Refund::class,
            ScoreEvent::class,
            StaffAttendanceEntry::class,
            StaffProfile::class,
            StockTransfer::class,
            StockTransferItem::class,
            Subscription::class,
            SubscriptionEvent::class,
            SubscriptionInvoice::class,
            SubscriptionPayment::class,
            Tournament::class,
            TournamentBracketMatch::class,
            TournamentDivision::class,
            TournamentRegistration::class,
            WaiverTemplate::class,
        ] as $model) {
            Gate::policy($model, TenantResourcePolicy::class);
        }
    }
}
