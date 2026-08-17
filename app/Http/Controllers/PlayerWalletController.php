<?php

namespace App\Http\Controllers;

use App\Models\OrganizationPlayer;
use App\Models\Payment;
use App\Models\PosTransaction;
use App\Models\Reservation;
use App\Services\PlayerProfileResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayerWalletController extends Controller
{
    public function __invoke(Request $request, PlayerProfileResolver $profiles): Response
    {
        $profile = $profiles->forUser($request->user());

        $organizationPlayers = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->with(['organization:id,name', 'homeBranch:id,name', 'legacyPlayer:id,wallet_balance'])
            ->where('player_profile_id', $profile->id)
            ->get();

        $legacyPlayerIds = $organizationPlayers->pluck('legacy_player_id')->filter()->values();
        $reservationIds = Reservation::query()
            ->withoutGlobalScope('organization')
            ->whereIn('player_id', $legacyPlayerIds)
            ->pluck('id');

        return Inertia::render('player-wallet', [
            'profile' => [
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
            ],
            'wallets' => $organizationPlayers->map(fn (OrganizationPlayer $organizationPlayer) => [
                'id' => $organizationPlayer->id,
                'organization' => $organizationPlayer->organization?->name,
                'home_branch' => $organizationPlayer->homeBranch?->name,
                'status' => $organizationPlayer->status,
                'local_player_number' => $organizationPlayer->local_player_number,
                'wallet_balance' => $organizationPlayer->wallet_balance ?: ($organizationPlayer->legacyPlayer?->wallet_balance ?? 0),
            ])->values(),
            'payments' => Payment::query()
                ->withoutGlobalScope('organization')
                ->with(['transaction:id,reference,total_amount,status'])
                ->whereIn('reservation_id', $reservationIds)
                ->latest('paid_at')
                ->limit(20)
                ->get()
                ->map(fn (Payment $payment) => [
                    'id' => $payment->id,
                    'reference' => $payment->reference,
                    'amount' => $payment->amount,
                    'method' => $payment->method,
                    'status' => $payment->status,
                    'paid_at' => $payment->paid_at?->toDateTimeString(),
                    'transaction_reference' => $payment->transaction?->reference,
                ]),
            'posTransactions' => PosTransaction::query()
                ->withoutGlobalScope('organization')
                ->whereIn('player_id', $legacyPlayerIds)
                ->latest()
                ->limit(20)
                ->get(['id', 'reference', 'total_amount', 'payment_method', 'status', 'created_at'])
                ->map(fn (PosTransaction $transaction) => [
                    'id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'total_amount' => $transaction->total_amount,
                    'payment_method' => $transaction->payment_method,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at?->toDateTimeString(),
                ]),
        ]);
    }
}
