<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashierSessionService
{
    public function __construct(private readonly BranchClock $clock) {}

    public function open(User $user, Branch $branch, float $openingCash = 0): CashierSession
    {
        $openSession = CashierSession::query()
            ->where('user_id', $user->id)
            ->where('branch_id', $branch->id)
            ->where('status', 'open')
            ->first();

        if ($openSession) {
            return $openSession;
        }

        [$startOfDay, $endOfDay] = $this->clock->dayRange(branch: $branch);
        $localDate = $this->clock->today($branch);

        return CashierSession::query()->create([
            'organization_id' => $branch->organization_id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'reference' => sprintf('TILL-%s-%s-%04d', $branch->code, $localDate->format('Ymd'), CashierSession::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1),
            'opening_cash' => $openingCash,
            'expected_cash' => $openingCash,
            'status' => 'open',
            'opened_at' => now(),
        ]);
    }

    public function close(CashierSession $session, float $closingCash): CashierSession
    {
        if ($session->status !== 'open') {
            throw ValidationException::withMessages(['session' => 'This cashier session is already closed.']);
        }

        return DB::transaction(function () use ($session, $closingCash) {
            $cashSales = (float) $session->transactions()
                ->where('payment_method', 'cash')
                ->where('status', 'paid')
                ->sum('total_amount');

            $expected = (float) $session->opening_cash + $cashSales;

            $session->update([
                'status' => 'closed',
                'closing_cash' => $closingCash,
                'expected_cash' => $expected,
                'cash_variance' => round($closingCash - $expected, 2),
                'closed_at' => now(),
            ]);

            return $session->refresh();
        });
    }
}
