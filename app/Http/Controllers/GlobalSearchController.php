<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Court;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\Payment;
use App\Models\PlayerProfile;
use App\Models\PosTransaction;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\StaffProfile;
use App\Models\Tournament;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request, TenantContext $tenantContext): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        if (strlen($search) < 2) {
            return response()->json(['results' => []]);
        }

        $role = $tenantContext->activeRole()?->value;
        $results = $request->user()?->is_superadmin
            ? $this->superadminResults($search)
            : ($role === 'player' ? $this->publicResults($search) : $this->tenantResults($search, $tenantContext));

        return response()->json(['results' => $results->take(30)->values()]);
    }

    private function tenantResults(string $search, TenantContext $tenantContext): Collection
    {
        $branchId = $tenantContext->currentBranchId();

        return collect()
            ->merge(OrganizationPlayer::query()
                ->with('playerProfile:id,courtprime_player_id,display_name,email')
                ->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('home_branch_id')->orWhere('home_branch_id', $branchId)))
                ->whereHas('playerProfile', fn ($query) => $query
                    ->where('display_name', 'like', "%{$search}%")
                    ->orWhere('courtprime_player_id', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                ->limit(6)
                ->get()
                ->map(fn (OrganizationPlayer $player) => $this->result('Player', $player->playerProfile?->display_name, $player->playerProfile?->courtprime_player_id, route('players.identity.show', $player, false))))
            ->merge(Reservation::query()
                ->with(['court:id,name', 'player:id,name'])
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('reference', 'like', "%{$search}%")
                ->limit(6)
                ->get()
                ->map(fn (Reservation $reservation) => $this->result('Reservation', $reservation->reference, ($reservation->player?->name ?? 'Walk-in').' - '.$reservation->court?->name, route('reservations.index', absolute: false))))
            ->merge(PosTransaction::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('reference', 'like', "%{$search}%")
                ->limit(6)
                ->get()
                ->map(fn (PosTransaction $transaction) => $this->result('Transaction', $transaction->reference, $transaction->status, route('pos.receipt', $transaction, false))))
            ->merge(Payment::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('reference', 'like', "%{$search}%")
                ->limit(6)
                ->get()
                ->map(fn (Payment $payment) => $this->result('Payment', $payment->reference, $payment->status, route('payments.index', absolute: false))))
            ->merge(Court::query()
                ->with('branch:id,name,code')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('name', 'like', "%{$search}%")
                ->limit(6)
                ->get()
                ->map(fn (Court $court) => $this->result('Court', $court->name, $court->branch?->code.' - '.$court->status, route('courts.index', absolute: false))))
            ->merge(Product::query()
                ->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%")->orWhere('barcode', 'like', "%{$search}%"))
                ->limit(6)
                ->get()
                ->map(fn (Product $product) => $this->result('Product', $product->name, $product->sku, route('products.index', absolute: false))))
            ->merge(Tournament::query()
                ->where('name', 'like', "%{$search}%")
                ->limit(6)
                ->get()
                ->map(fn (Tournament $tournament) => $this->result('Tournament', $tournament->name, $tournament->status, route('tournaments.index', absolute: false))))
            ->merge(StaffProfile::query()
                ->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))
                ->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('employee_id', 'like', "%{$search}%")->orWhere('position', 'like', "%{$search}%"))
                ->limit(6)
                ->get()
                ->map(fn (StaffProfile $staff) => $this->result('Staff', $staff->name, $staff->employee_id.' - '.$staff->position, route('staff.index', absolute: false))));
    }

    private function publicResults(string $search): Collection
    {
        return collect()
            ->merge(Branch::query()
                ->withoutGlobalScope('organization')
                ->with('organization:id,name,slug,status')
                ->where('status', 'active')
                ->whereHas('organization', fn ($query) => $query->whereIn('status', ['trial', 'active']))
                ->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('address', 'like', "%{$search}%"))
                ->limit(8)
                ->get()
                ->map(fn (Branch $branch) => $this->result('Club', $branch->organization?->name.' / '.$branch->name, $branch->address, route('clubs.public.show', $branch->organization?->slug, false))))
            ->merge(Tournament::query()
                ->withoutGlobalScope('organization')
                ->where('visibility', 'public')
                ->whereIn('status', ['published', 'registration_open', 'live'])
                ->where('name', 'like', "%{$search}%")
                ->limit(8)
                ->get()
                ->map(fn (Tournament $tournament) => $this->result('Tournament', $tournament->name, $tournament->starts_on?->toDateString(), route('tournaments.discovery', absolute: false))))
            ->merge(PlayerProfile::query()
                ->where('status', 'active')
                ->where(fn ($query) => $query->where('display_name', 'like', "%{$search}%")->orWhere('courtprime_player_id', 'like', "%{$search}%"))
                ->limit(8)
                ->get()
                ->map(fn (PlayerProfile $profile) => $this->result('Public Player', $profile->display_name, $profile->courtprime_player_id, route('player-identities.public', $profile->courtprime_player_id, false))));
    }

    private function superadminResults(string $search): Collection
    {
        return $this->publicResults($search)
            ->merge(Organization::query()
                ->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                ->limit(8)
                ->get()
                ->map(fn (Organization $organization) => $this->result('Organization', $organization->name, $organization->status, route('tenant-subscriptions.index', absolute: false))));
    }

    private function result(string $type, ?string $title, ?string $subtitle, string $href): array
    {
        return [
            'type' => $type,
            'title' => $title ?: $type,
            'subtitle' => $subtitle,
            'href' => $href,
        ];
    }
}
