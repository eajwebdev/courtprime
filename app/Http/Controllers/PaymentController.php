<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentRefundStoreRequest;
use App\Models\Branch;
use App\Models\Payment;
use App\Models\Refund;
use App\Services\ActivityTimelineService;
use App\Services\BranchClock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(private readonly BranchClock $clock)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', Payment::class);

        [$startOfDay, $endOfDay] = $this->clock->dayRange();
        $todayRefunds = (float) Refund::query()->whereBetween('processed_at', [$startOfDay, $endOfDay])->where('status', 'processed')->sum('amount');
        $todayPayments = (float) Payment::query()->whereBetween('paid_at', [$startOfDay, $endOfDay])->sum('amount');

        return Inertia::render('payments', [
            'payments' => Payment::query()
                ->with(['transaction', 'refunds' => fn ($query) => $query->latest('processed_at')->limit(3)])
                ->withSum(['refunds as refunded_amount' => fn ($query) => $query->where('status', 'processed')], 'amount')
                ->latest()
                ->paginate(20),
            'metrics' => [
                'today' => $todayPayments,
                'refunds' => $todayRefunds,
                'net' => $todayPayments - $todayRefunds,
                'cash' => (float) Payment::query()->whereBetween('paid_at', [$startOfDay, $endOfDay])->where('method', 'cash')->sum('amount'),
                'digital' => (float) Payment::query()->whereBetween('paid_at', [$startOfDay, $endOfDay])->where('method', '!=', 'cash')->sum('amount'),
            ],
        ]);
    }

    public function refund(PaymentRefundStoreRequest $request, Payment $payment, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('update', $payment);
        $this->authorize('create', Refund::class);

        $validated = $request->validated();
        $refunded = (float) $payment->refunds()->where('status', 'processed')->sum('amount');
        $remaining = max(0, (float) $payment->amount - $refunded);
        $amount = (float) $validated['amount'];

        if ($amount > $remaining) {
            throw ValidationException::withMessages([
                'amount' => 'Refund amount cannot exceed the remaining paid balance.',
            ]);
        }

        $refund = Refund::query()->create([
            'organization_id' => $payment->organization_id,
            'branch_id' => $payment->branch_id,
            'payment_id' => $payment->id,
            'reference' => $this->nextRefundReference($payment),
            'amount' => $amount,
            'reason' => $validated['reason'],
            'status' => 'processed',
            'processed_by' => auth()->id(),
            'processed_at' => now(),
        ]);

        $payment->update([
            'status' => $amount >= $remaining ? 'refunded' : 'partially_refunded',
        ]);

        $timeline->record($payment, 'payment.refunded', 'Payment refund recorded', [
            'related' => $refund,
            'organization_id' => $payment->organization_id,
            'branch_id' => $payment->branch_id,
            'description' => $validated['reason'],
            'metadata' => ['amount' => $amount, 'remaining_before_refund' => $remaining],
        ]);

        return back()->with('success', 'CourtPrime refund recorded.');
    }

    private function nextRefundReference(Payment $payment): string
    {
        $branch = $payment->branch_id
            ? Branch::query()->withoutGlobalScope('organization')->find($payment->branch_id)
            : null;
        [$startOfDay, $endOfDay] = $this->clock->dayRange(branch: $branch);
        $localDate = $this->clock->today($branch);

        return 'CP-RFD-'.$localDate->format('Ymd').'-'.str_pad((string) (Refund::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1), 6, '0', STR_PAD_LEFT);
    }
}
