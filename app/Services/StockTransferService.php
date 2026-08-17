<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\StockTransfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockTransferService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly BranchClock $clock,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): StockTransfer
    {
        return DB::transaction(function () use ($data) {
            $fromBranch = Branch::query()->findOrFail($data['from_branch_id']);
            $toBranch = Branch::query()->findOrFail($data['to_branch_id']);

            if ((int) $fromBranch->organization_id !== (int) $toBranch->organization_id) {
                throw ValidationException::withMessages(['to_branch_id' => 'Transfers must stay inside one CourtPrime organization.']);
            }

            $items = collect($data['items'] ?? [])->filter(fn ($item) => ! empty($item['product_id']) && (float) ($item['quantity'] ?? 0) > 0);

            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Add at least one product to transfer.']);
            }

            $transfer = StockTransfer::query()->create([
                'organization_id' => $fromBranch->organization_id,
                'from_branch_id' => $fromBranch->id,
                'to_branch_id' => $toBranch->id,
                'reference' => $this->reference($fromBranch),
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($items as $item) {
                $product = Product::query()->findOrFail($item['product_id']);

                if ((int) $product->organization_id !== (int) $fromBranch->organization_id) {
                    throw ValidationException::withMessages(['items' => 'Transfer products must belong to the selected organization.']);
                }

                $transfer->items()->create([
                    'organization_id' => $fromBranch->organization_id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                ]);
            }

            return $transfer->load(['fromBranch', 'toBranch', 'items.product']);
        });
    }

    public function send(StockTransfer $transfer): StockTransfer
    {
        if ($transfer->status !== 'draft') {
            throw ValidationException::withMessages(['status' => 'Only draft transfers can be sent.']);
        }

        return DB::transaction(function () use ($transfer) {
            $transfer->load('items.product');

            foreach ($transfer->items as $item) {
                $this->inventory->move($item->product, 'transfer_out', (float) $item->quantity, [
                    'branch_id' => $transfer->from_branch_id,
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $transfer->id,
                    'notes' => 'Stock transfer sent '.$transfer->reference,
                ]);
            }

            $transfer->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return $transfer->refresh()->load(['fromBranch', 'toBranch', 'items.product']);
        });
    }

    public function receive(StockTransfer $transfer): StockTransfer
    {
        if ($transfer->status !== 'sent') {
            throw ValidationException::withMessages(['status' => 'Only sent transfers can be received.']);
        }

        return DB::transaction(function () use ($transfer) {
            $transfer->load('items.product');

            foreach ($transfer->items as $item) {
                $this->inventory->move($item->product, 'transfer_in', (float) $item->quantity, [
                    'branch_id' => $transfer->to_branch_id,
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $transfer->id,
                    'notes' => 'Stock transfer received '.$transfer->reference,
                ]);
            }

            $transfer->update([
                'status' => 'received',
                'received_at' => now(),
            ]);

            return $transfer->refresh()->load(['fromBranch', 'toBranch', 'items.product']);
        });
    }

    private function reference(Branch $branch): string
    {
        [$startOfDay, $endOfDay] = $this->clock->dayRange(branch: $branch);
        $localDate = $this->clock->today($branch);

        return sprintf('TRF-%s-%s-%04d', $branch->code, $localDate->format('Ymd'), StockTransfer::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1);
    }
}
