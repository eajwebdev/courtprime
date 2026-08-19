<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountReceivablePaymentRequest;
use App\Http\Requests\AccountReceivableStoreRequest;
use App\Models\AccountReceivable;
use App\Models\Branch;
use App\Models\OrganizationPlayer;
use App\Models\Reservation;
use App\Services\ActivityTimelineService;
use App\Services\BranchClock;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AccountReceivableController extends Controller
{
    public function __construct(private readonly BranchClock $clock) {}

    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', AccountReceivable::class);

        $branchId = $tenantContext->currentBranchId();

        return Inertia::render('accounts-receivable', [
            'receivables' => AccountReceivable::query()
                ->with(['branch:id,name,code', 'organizationPlayer.playerProfile:id,display_name,courtprime_player_id'])
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->latest()
                ->paginate(20),
            'branches' => Branch::query()->when($branchId, fn ($query) => $query->whereKey($branchId))->orderBy('name')->get(['id', 'name', 'code']),
            'players' => OrganizationPlayer::query()
                ->with('playerProfile:id,display_name,courtprime_player_id')
                ->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('home_branch_id')->orWhere('home_branch_id', $branchId)))
                ->limit(100)
                ->get(['id', 'player_profile_id', 'local_player_number']),
            'reservations' => Reservation::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->whereIn('payment_status', ['pending', 'partial'])
                ->latest()
                ->limit(100)
                ->get(['id', 'reference', 'amount_due']),
            'metrics' => [
                'open' => (float) AccountReceivable::query()->whereIn('status', ['open', 'partial', 'overdue'])->sum('balance'),
                'overdue' => (float) AccountReceivable::query()->where('status', 'overdue')->sum('balance'),
                'settledMonth' => (float) AccountReceivable::query()->where('status', 'settled')->whereBetween('settled_at', [today()->startOfMonth(), today()->endOfMonth()])->sum('amount_paid'),
            ],
        ]);
    }

    public function store(AccountReceivableStoreRequest $request, TenantContext $tenantContext, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('create', AccountReceivable::class);

        $validated = $request->validated();
        $branchId = $this->branchId($validated['branch_id'] ?? null, $tenantContext);
        $reservation = $this->reservation($validated['reservation_id'] ?? null, $branchId, $tenantContext);
        $organizationPlayer = $this->organizationPlayer($validated['organization_player_id'] ?? null, $branchId, $tenantContext);
        $amount = (float) $validated['amount_due'];

        $finalBranchId = $reservation?->branch_id ?? $branchId;

        $receivable = AccountReceivable::query()->create([
            ...$validated,
            'organization_id' => $tenantContext->currentOrganizationId(),
            'branch_id' => $finalBranchId,
            'organization_player_id' => $organizationPlayer?->id,
            'reservation_id' => $reservation?->id,
            'reference' => $this->nextReference($finalBranchId),
            'amount_paid' => 0,
            'balance' => $amount,
            'status' => $this->status($amount, $validated['due_date'] ?? null),
            'created_by' => $request->user()->id,
        ]);

        $timeline->record($receivable, 'receivable.created', 'Account receivable created', [
            'organization_id' => $receivable->organization_id,
            'branch_id' => $receivable->branch_id,
            'metadata' => ['amount_due' => $receivable->amount_due, 'category' => $receivable->category],
        ]);

        return back()->with('success', 'CourtPrime receivable recorded.');
    }

    public function payment(AccountReceivablePaymentRequest $request, AccountReceivable $accountReceivable, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('update', $accountReceivable);

        $validated = $request->validated();
        $amount = (float) $validated['amount'];
        $balance = (float) $accountReceivable->balance;

        if ($amount > $balance) {
            throw ValidationException::withMessages(['amount' => 'Payment cannot exceed the receivable balance.']);
        }

        $paid = (float) $accountReceivable->amount_paid + $amount;
        $nextBalance = max(0, $balance - $amount);

        $accountReceivable->update([
            'amount_paid' => $paid,
            'balance' => $nextBalance,
            'status' => $nextBalance <= 0 ? 'settled' : 'partial',
            'settled_at' => $nextBalance <= 0 ? now() : null,
        ]);

        $timeline->record($accountReceivable, 'receivable.payment', 'Receivable payment recorded', [
            'organization_id' => $accountReceivable->organization_id,
            'branch_id' => $accountReceivable->branch_id,
            'metadata' => ['amount' => $amount, 'balance' => $nextBalance],
        ]);

        return back()->with('success', 'CourtPrime receivable payment recorded.');
    }

    private function branchId(int|string|null $branchId, TenantContext $tenantContext): ?int
    {
        $activeBranchId = $tenantContext->currentBranchId();

        if ($activeBranchId && (! $branchId || (int) $branchId !== $activeBranchId)) {
            throw ValidationException::withMessages(['branch_id' => 'Select the active branch workspace before saving this receivable.']);
        }

        if (! $branchId) {
            return null;
        }

        $exists = Branch::query()
            ->withoutGlobalScope('organization')
            ->whereKey((int) $branchId)
            ->where('organization_id', $tenantContext->currentOrganizationId())
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages(['branch_id' => 'Select a branch inside the active organization.']);
        }

        return (int) $branchId;
    }

    private function organizationPlayer(int|string|null $organizationPlayerId, ?int $branchId, TenantContext $tenantContext): ?OrganizationPlayer
    {
        if (! $organizationPlayerId) {
            return null;
        }

        $organizationPlayer = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->whereKey((int) $organizationPlayerId)
            ->where('organization_id', $tenantContext->currentOrganizationId())
            ->when($branchId, fn ($query) => $query->where(fn ($query) => $query
                ->whereNull('home_branch_id')
                ->orWhere('home_branch_id', $branchId)))
            ->first();

        if (! $organizationPlayer) {
            throw ValidationException::withMessages(['organization_player_id' => 'Select a player linked to the active organization or branch.']);
        }

        return $organizationPlayer;
    }

    private function reservation(int|string|null $reservationId, ?int $branchId, TenantContext $tenantContext): ?Reservation
    {
        if (! $reservationId) {
            return null;
        }

        $reservation = Reservation::query()
            ->withoutGlobalScope('organization')
            ->whereKey((int) $reservationId)
            ->where('organization_id', $tenantContext->currentOrganizationId())
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->first();

        if (! $reservation) {
            throw ValidationException::withMessages(['reservation_id' => 'Select a reservation inside the active organization or branch.']);
        }

        return $reservation;
    }

    private function nextReference(?int $branchId): string
    {
        $branch = $branchId
            ? Branch::query()->withoutGlobalScope('organization')->find($branchId)
            : null;
        [$startOfDay, $endOfDay] = $this->clock->dayRange(branch: $branch);
        $localDate = $this->clock->today($branch);

        return 'CP-AR-'.$localDate->format('Ymd').'-'.str_pad((string) (AccountReceivable::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1), 6, '0', STR_PAD_LEFT);
    }

    private function status(float $balance, ?string $dueDate): string
    {
        if ($balance <= 0) {
            return 'settled';
        }

        return $dueDate && today()->gt($dueDate) ? 'overdue' : 'open';
    }
}
