<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): Response
    {
        $this->authorize('viewAny', InventoryMovement::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['inventory'], 'inventory');

        return Inertia::render('inventory', [
            'products' => Product::query()->with('category')->orderBy('name')->get(),
            'movements' => InventoryMovement::query()->with('product')->latest()->limit(25)->get(),
            'metrics' => [
                'lowStock' => Product::query()->whereColumn('stock_on_hand', '<=', 'reorder_point')->count(),
                'outOfStock' => Product::query()->where('stock_on_hand', '<=', 0)->count(),
                'stockValue' => (float) Product::query()->selectRaw('sum(stock_on_hand * cost) as value')->value('value'),
            ],
        ]);
    }
}
