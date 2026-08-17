<?php

namespace App\Http\Controllers;

use App\Http\Requests\POSCheckoutRequest;
use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\Payment;
use App\Models\PosTransaction;
use App\Models\Product;
use App\Services\POSService;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function index(TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): Response
    {
        $this->authorize('viewAny', PosTransaction::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['pos', 'basic_pos'], 'POS');

        return Inertia::render('pos', [
            'branches' => Branch::query()->orderBy('name')->get(),
            'products' => Product::query()->where('is_active', true)->orderBy('name')->get(),
            'openSession' => CashierSession::query()
                ->with('branch')
                ->where('user_id', auth()->id())
                ->where('status', 'open')
                ->first(),
            'transactions' => PosTransaction::query()->with(['items', 'branch'])->latest()->limit(12)->get(),
        ]);
    }

    public function store(POSCheckoutRequest $request, POSService $pos, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate)
    {
        $this->authorize('create', PosTransaction::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['pos', 'basic_pos'], 'POS');

        $branch = Branch::query()->findOrFail($request->integer('branch_id'));
        $pos->sell($request->user(), $branch, $request->validated());

        return back()->with('success', 'Sale completed.');
    }

    public function receipt(PosTransaction $posTransaction): Response
    {
        $this->authorize('view', $posTransaction);

        $posTransaction->load(['items.product', 'branch.organization', 'cashierSession']);

        return Inertia::render('pos-receipt', [
            'transaction' => $posTransaction,
            'payment' => Payment::query()->where('pos_transaction_id', $posTransaction->id)->first(),
            'branding' => [
                'logo_url' => $posTransaction->branch?->organization?->settings['logo_url'] ?? null,
                'receipt_footer' => $posTransaction->branch?->organization?->settings['receipt_footer'] ?? 'Thank you for playing with CourtPrime.',
                'allow_white_label' => $posTransaction->branch?->organization?->settings['allow_white_label'] ?? false,
            ],
        ]);
    }
}
