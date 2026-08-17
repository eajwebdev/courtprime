<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\Payment;
use App\Models\PosTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class POSService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly BranchClock $clock,
    ) {}

    public function sell(User $cashier, Branch $branch, array $data): PosTransaction
    {
        return DB::transaction(function () use ($cashier, $branch, $data) {
            $items = collect($data['items'] ?? [])->filter(fn ($item) => ! empty($item['product_id']) && (float) ($item['quantity'] ?? 0) > 0);

            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Add at least one product to sell.']);
            }

            $session = CashierSession::query()
                ->where('branch_id', $branch->id)
                ->where('user_id', $cashier->id)
                ->where('status', 'open')
                ->first();

            if (! $session) {
                throw ValidationException::withMessages(['cashier_session' => 'Open a cashier session before selling.']);
            }

            $subtotal = 0;
            $prepared = $items->map(function (array $item) use (&$subtotal) {
                $product = Product::query()->findOrFail($item['product_id']);
                $quantity = (float) $item['quantity'];
                $lineTotal = round(((float) $product->price) * $quantity, 2);
                $subtotal += $lineTotal;

                return compact('product', 'quantity', 'lineTotal');
            });

            $discount = (float) ($data['discount_amount'] ?? 0);
            $tax = round(max($subtotal - $discount, 0) * ($branch->tax_rate / 100), 2);
            $total = round(max($subtotal - $discount, 0) + $tax, 2);
            $tendered = (float) ($data['amount_tendered'] ?? $total);
            [$startOfDay, $endOfDay] = $this->clock->dayRange(branch: $branch);
            $localDate = $this->clock->today($branch);

            if ($tendered < $total && ($data['payment_method'] ?? 'cash') === 'cash') {
                throw ValidationException::withMessages(['amount_tendered' => 'Cash tendered cannot be less than the total.']);
            }

            $transaction = PosTransaction::query()->create([
                'organization_id' => $branch->organization_id,
                'branch_id' => $branch->id,
                'cashier_session_id' => $session->id,
                'user_id' => $cashier->id,
                'reference' => sprintf('POS-%s-%s-%04d', $branch->code, $localDate->format('Ymd'), PosTransaction::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1),
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'total_amount' => $total,
                'amount_tendered' => $tendered,
                'change_due' => max(round($tendered - $total, 2), 0),
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status' => 'paid',
            ]);

            foreach ($prepared as $item) {
                $transaction->items()->create([
                    'organization_id' => $branch->organization_id,
                    'product_id' => $item['product']->id,
                    'description' => $item['product']->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']->price,
                    'line_total' => $item['lineTotal'],
                ]);

                $this->inventory->move($item['product'], 'sale', $item['quantity'], [
                    'branch_id' => $branch->id,
                    'reference_type' => PosTransaction::class,
                    'reference_id' => $transaction->id,
                    'notes' => 'POS sale '.$transaction->reference,
                    'created_by' => $cashier->id,
                ]);
            }

            Payment::query()->create([
                'organization_id' => $branch->organization_id,
                'branch_id' => $branch->id,
                'pos_transaction_id' => $transaction->id,
                'reference' => sprintf('PAY-%s-%s-%04d', $branch->code, $localDate->format('Ymd'), Payment::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1),
                'amount' => $total,
                'method' => $transaction->payment_method,
                'status' => 'paid',
                'received_by' => $cashier->id,
                'paid_at' => now(),
            ]);

            return $transaction->load('items.product', 'branch', 'cashierSession');
        });
    }
}
