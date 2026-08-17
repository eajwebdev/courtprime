<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductStoreRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Product::class);

        return Inertia::render('products', [
            'products' => Product::query()->with('category')->orderBy('name')->paginate(20),
            'categories' => ProductCategory::query()->orderBy('name')->get(),
            'metrics' => [
                'total' => Product::query()->count(),
                'lowStock' => Product::query()->whereColumn('stock_on_hand', '<=', 'reorder_point')->count(),
                'inventoryValue' => (float) Product::query()->selectRaw('sum(stock_on_hand * cost) as value')->value('value'),
            ],
        ]);
    }

    public function store(ProductStoreRequest $request, TenantContext $tenantContext)
    {
        $this->authorize('create', Product::class);

        Product::query()->create([
            ...$request->validated(),
            'organization_id' => $tenantContext->currentOrganizationId(),
            'is_active' => true,
            'track_inventory' => $request->boolean('track_inventory', true),
        ]);

        return back()->with('success', 'Product created.');
    }
}
