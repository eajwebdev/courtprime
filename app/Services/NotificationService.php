<?php

namespace App\Services;

use App\Models\CourtPrimeNotification;
use App\Models\MaintenanceWorkOrder;
use App\Models\PlayerProfile;
use App\Models\Refund;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Who hears about what.
 *
 * Notifications were written straight into the table from wherever the event
 * happened, so the rules for who sees one lived in four controllers and a job.
 * They live here now, and the rest of the app says what happened rather than
 * who should be told.
 *
 * Three audiences, and the difference matters because the notification centre
 * reads the same three columns back:
 *
 *   · the club   — organization_id set, no user, no player. Everyone with a
 *                  workspace on that club sees it. The owner's feed.
 *   · one member of staff — user_id set.
 *   · one player — player_profile_id set, and it follows them across clubs.
 *
 * What is deliberately NOT here: a notification for every booking taken. A club
 * running forty courts would bury the things that need somebody to act in a
 * stream of things that do not. The club feed is for exceptions — money going
 * back out, a court going down, somebody waiting on a reply.
 */
class NotificationService
{
    /**
     * Everything one person may see, as a query.
     *
     * The notification centre, the header bell and the sidebar badge all have to
     * agree — a badge counting one thing while the page lists another is worse
     * than no badge. They all read this.
     *
     * @return Builder<CourtPrimeNotification>
     */
    public function visibleTo(User $user, ?int $organizationId): Builder
    {
        $profileId = $user->playerProfile?->id;

        return CourtPrimeNotification::query()->where(function (Builder $query) use ($user, $organizationId, $profileId) {
            /* Addressed to them personally. */
            $query->where('user_id', $user->id);

            /* Addressed to them as a player, wherever they play. */
            if ($profileId) {
                $query->orWhere('player_profile_id', $profileId);
            }

            /* Addressed to the club whose workspace they are in. */
            if ($organizationId) {
                $query->orWhere(function (Builder $query) use ($organizationId) {
                    $query->where('organization_id', $organizationId)->whereNull('user_id')->whereNull('player_profile_id');
                });
            }

            /* Platform-wide, for the operator. */
            if ($user->is_superadmin) {
                $query->orWhere(function (Builder $query) {
                    $query->whereNull('organization_id')->whereNull('user_id')->whereNull('player_profile_id');
                });
            }
        });
    }

    /** How many of those are still waiting on them. */
    public function unreadCountFor(User $user, ?int $organizationId): int
    {
        return $this->visibleTo($user, $organizationId)->whereNull('read_at')->count();
    }

    /** Something the whole club should see. */
    public function toClub(int $organizationId, string $category, string $title, string $body, array $data = []): CourtPrimeNotification
    {
        return CourtPrimeNotification::query()->create([
            'organization_id' => $organizationId,
            'user_id' => null,
            'player_profile_id' => null,
            'category' => $category,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    /** Something one member of staff should see. */
    public function toUser(User|int $user, string $category, string $title, string $body, array $data = [], ?int $organizationId = null): CourtPrimeNotification
    {
        $model = $user instanceof User ? $user : User::query()->find($user);

        return CourtPrimeNotification::query()->create([
            'organization_id' => $organizationId ?? $model?->organization_id,
            'user_id' => $model?->id,
            'player_profile_id' => null,
            'category' => $category,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    /** Something one player should see, wherever they are playing. */
    public function toPlayer(PlayerProfile|int $profile, string $category, string $title, string $body, array $data = [], ?int $organizationId = null): CourtPrimeNotification
    {
        $id = $profile instanceof PlayerProfile ? $profile->id : $profile;

        return CourtPrimeNotification::query()->create([
            'organization_id' => $organizationId,
            'user_id' => null,
            'player_profile_id' => $id,
            'category' => $category,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    /*
     * ---------------------------------------------------------------------
     * The events themselves. Named, so a caller states what happened and this
     * decides the wording and the audience.
     * ---------------------------------------------------------------------
     */

    /** A court that was sold is now free again, which somebody may want to resell. */
    public function reservationCancelled(Reservation $reservation, ?string $reason = null): void
    {
        $when = $reservation->reservation_date?->format('D j M').' '.substr((string) $reservation->start_time, 0, 5);

        $this->toClub(
            (int) $reservation->organization_id,
            'reservation',
            'Booking cancelled',
            trim($reservation->reference.' · '.$when.($reason ? ' · '.$reason : '')),
            ['url' => '/reservations?date='.$reservation->reservation_date?->toDateString(), 'reservation_id' => $reservation->id],
        );
    }

    /** Money going back out is the one payment event an owner always wants. */
    public function refundIssued(Refund $refund): void
    {
        $this->toClub(
            (int) $refund->organization_id,
            'payment',
            'Refund issued',
            /* The amount, plainly. The currency lives on the club and the feed
               is already scoped to one, so the symbol adds nothing here. */
            $refund->reference.' · '.number_format((float) $refund->amount, 2).($refund->reason ? ' · '.$refund->reason : ''),
            ['url' => '/payments', 'refund_id' => $refund->id],
        );
    }

    /** A court out of service is revenue stopping until somebody fixes it. */
    public function maintenanceRaised(MaintenanceWorkOrder $order): void
    {
        $this->toClub(
            (int) $order->organization_id,
            'maintenance',
            $order->priority === 'urgent' ? 'Urgent maintenance raised' : 'Maintenance raised',
            trim(($order->title ?? 'Work order').' · '.($order->court?->name ?? $order->branch?->name ?? '')),
            ['url' => '/maintenance', 'work_order_id' => $order->id],
        );
    }
}
