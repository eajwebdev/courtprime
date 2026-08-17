<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function move(Product $product, string $type, float $quantity, array $meta = []): InventoryMovement
    {
        if ($product->track_inventory && in_array($type, ['sale', 'transfer_out', 'adjustment_out'], true) && $product->stock_on_hand < $quantity) {
            throw ValidationException::withMessages([
                'items' => "{$product->name} does not have enough stock.",
            ]);
        }

        $signedQuantity = in_array($type, ['sale', 'transfer_out', 'adjustment_out'], true) ? -$quantity : $quantity;
        $stockAfter = (int) round($product->stock_on_hand + $signedQuantity);

        if ($product->track_inventory) {
            $product->update(['stock_on_hand' => $stockAfter]);
        }

        return InventoryMovement::query()->create([
            'organization_id' => $product->organization_id,
            'branch_id' => $meta['branch_id'] ?? null,
            'product_id' => $product->id,
            'movement_type' => $type,
            'quantity' => $signedQuantity,
            'stock_after' => $product->track_inventory ? $stockAfter : $product->stock_on_hand,
            'reference_type' => $meta['reference_type'] ?? null,
            'reference_id' => $meta['reference_id'] ?? null,
            'notes' => $meta['notes'] ?? null,
            'created_by' => $meta['created_by'] ?? auth()->id(),
        ]);
    }
}
