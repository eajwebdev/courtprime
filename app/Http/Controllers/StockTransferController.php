<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockTransferStoreRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Services\StockTransferService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StockTransferController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', StockTransfer::class);

        return Inertia::render('stock-transfers', [
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name', 'code']),
            'products' => Product::query()->where('track_inventory', true)->orderBy('name')->get(['id', 'name', 'sku', 'stock_on_hand', 'unit']),
            'transfers' => StockTransfer::query()
                ->with(['fromBranch', 'toBranch', 'items.product'])
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(StockTransferStoreRequest $request, StockTransferService $transfers, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('create', StockTransfer::class);
        $this->authorizeBranchScope((int) $request->integer('from_branch_id'), (int) $request->integer('to_branch_id'), $tenantContext);

        $transfers->create($request->validated());

        return back()->with('success', 'CourtPrime stock transfer drafted.');
    }

    public function send(StockTransfer $stockTransfer, StockTransferService $transfers, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('update', $stockTransfer);
        $this->authorizeBranchScope((int) $stockTransfer->from_branch_id, (int) $stockTransfer->to_branch_id, $tenantContext);

        $transfers->send($stockTransfer);

        return back()->with('success', 'CourtPrime stock transfer sent.');
    }

    public function receive(StockTransfer $stockTransfer, StockTransferService $transfers, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('update', $stockTransfer);
        $this->authorizeBranchScope((int) $stockTransfer->from_branch_id, (int) $stockTransfer->to_branch_id, $tenantContext);

        $transfers->receive($stockTransfer);

        return back()->with('success', 'CourtPrime stock transfer received.');
    }

    private function authorizeBranchScope(int $fromBranchId, int $toBranchId, TenantContext $tenantContext): void
    {
        $branchId = $tenantContext->currentBranchId();

        if (! $branchId) {
            return;
        }

        abort_unless($branchId === $fromBranchId || $branchId === $toBranchId, 403);
    }
}
