<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\InventoryMovement;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\PosTransaction;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourtPrimeSalesTest extends TestCase
{
    use RefreshDatabase;

    public function test_pos_sale_requires_an_open_cashier_session(): void
    {
        [$organization, $branch, $product, $cashier] = $this->salesFixture();

        $this->actingAs($cashier)
            ->from('/pos')
            ->post('/pos', [
                'branch_id' => $branch->id,
                'payment_method' => 'cash',
                'amount_tendered' => 500,
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ])
            ->assertSessionHasErrors('cashier_session');
    }

    public function test_pos_sale_creates_payment_items_and_inventory_movement(): void
    {
        [$organization, $branch, $product, $cashier] = $this->salesFixture();

        CashierSession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'user_id' => $cashier->id,
            'reference' => 'TILL-BAC-TEST-0001',
            'status' => 'open',
            'opening_cash' => 1000,
            'expected_cash' => 1000,
            'opened_at' => now(),
        ]);

        $this->actingAs($cashier)
            ->post('/pos', [
                'branch_id' => $branch->id,
                'payment_method' => 'cash',
                'amount_tendered' => 1000,
                'items' => [['product_id' => $product->id, 'quantity' => 2]],
            ])
            ->assertRedirect();

        $product->refresh();

        $this->assertSame(8, $product->stock_on_hand);
        $this->assertSame(1, PosTransaction::query()->count());
        $this->assertSame(1, Payment::query()->count());
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'sale')->count());
    }

    private function salesFixture(): array
    {
        $organization = Organization::query()->create(['name' => 'EAJ Club', 'slug' => 'eaj-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Bacolod', 'code' => 'BAC', 'tax_rate' => 12]);
        $category = ProductCategory::query()->create(['organization_id' => $organization->id, 'name' => 'Essentials']);
        $product = Product::query()->create([
            'organization_id' => $organization->id,
            'product_category_id' => $category->id,
            'sku' => 'BALL-001',
            'name' => 'Tournament Ball',
            'unit' => 'each',
            'price' => 250,
            'cost' => 100,
            'stock_on_hand' => 10,
            'reorder_point' => 2,
            'track_inventory' => true,
            'is_active' => true,
        ]);
        $cashier = User::factory()->create(['organization_id' => $organization->id, 'branch_id' => $branch->id, 'role_key' => 'cashier']);

        return [$organization, $branch, $product, $cashier];
    }
}
