<?php

namespace App\Http\Controllers;

use App\Events\CourtStatusChanged;
use App\Http\Requests\MaintenanceWorkOrderStoreRequest;
use App\Http\Requests\MaintenanceWorkOrderUpdateRequest;
use App\Models\Branch;
use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\MaintenanceWorkOrder;
use App\Models\User;
use App\Services\ActivityTimelineService;
use App\Services\BranchClock;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function __construct(private readonly BranchClock $clock)
    {
    }

    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', MaintenanceWorkOrder::class);

        $organizationId = $tenantContext->currentOrganizationId();
        $branchId = $tenantContext->currentBranchId();

        return Inertia::render('maintenance', [
            'canManageMaintenance' => $tenantContext->activeRole()?->canManageTenant() === true,
            'workOrders' => MaintenanceWorkOrder::query()
                ->with(['branch:id,name,code', 'court:id,name', 'assignee:id,name'])
                ->latest()
                ->paginate(20),
            'branches' => Branch::query()->when($branchId, fn ($query) => $query->whereKey($branchId))->orderBy('name')->get(['id', 'name', 'code']),
            'courts' => Court::query()->when($branchId, fn ($query) => $query->where('branch_id', $branchId))->orderBy('branch_id')->orderBy('court_number')->get(['id', 'branch_id', 'name', 'court_number', 'status']),
            'staff' => User::query()
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->orderBy('name')
                ->get(['id', 'name', 'role_key']),
        ]);
    }

    public function store(MaintenanceWorkOrderStoreRequest $request, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('create', MaintenanceWorkOrder::class);

        $validated = $request->validated();
        $tenantContext = app(TenantContext::class);

        if ($tenantContext->currentBranchId() && (int) $validated['branch_id'] !== $tenantContext->currentBranchId()) {
            throw ValidationException::withMessages(['branch_id' => 'Select the active branch workspace before creating this work order.']);
        }

        $branch = Branch::query()->findOrFail($validated['branch_id']);
        $court = null;

        if (! empty($validated['court_id'])) {
            $court = Court::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $branch->organization_id)
                ->where('branch_id', $branch->id)
                ->findOrFail($validated['court_id']);
        }

        return DB::transaction(function () use ($validated, $branch, $court, $timeline) {
            $block = null;

            if ($court && ($validated['block_court'] ?? false)) {
                if (empty($validated['scheduled_date']) || empty($validated['start_time']) || empty($validated['end_time'])) {
                    throw ValidationException::withMessages(['scheduled_date' => 'Court blocking requires a scheduled date, start time, and end time.']);
                }

                $block = CourtAvailabilityBlock::query()->create([
                    'organization_id' => $branch->organization_id,
                    'branch_id' => $branch->id,
                    'court_id' => $court->id,
                    'block_date' => $validated['scheduled_date'],
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'reason' => 'maintenance',
                    'notes' => $validated['title'],
                    'created_by' => auth()->id(),
                ]);

                $court->update(['status' => 'maintenance']);
                event(new CourtStatusChanged($court->refresh()));
            }

            $workOrder = MaintenanceWorkOrder::query()->create([
                'organization_id' => $branch->organization_id,
                'branch_id' => $branch->id,
                'court_id' => $court?->id,
                'court_availability_block_id' => $block?->id,
                'reported_by' => auth()->id(),
                'assigned_to' => $validated['assigned_to'] ?? null,
                'reference' => $this->nextReference($branch),
                'title' => $validated['title'],
                'priority' => $validated['priority'],
                'status' => $validated['status'],
                'scheduled_date' => $validated['scheduled_date'] ?? null,
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'estimated_cost' => $validated['estimated_cost'] ?? 0,
                'description' => $validated['description'] ?? null,
            ]);

            $timeline->record($workOrder, 'maintenance.created', 'Maintenance work order created', [
                'organization_id' => $workOrder->organization_id,
                'branch_id' => $workOrder->branch_id,
                'related' => $court,
                'description' => $workOrder->description,
                'metadata' => ['priority' => $workOrder->priority, 'status' => $workOrder->status],
            ]);

            return back()->with('success', 'CourtPrime maintenance work order created.');
        });
    }

    public function update(MaintenanceWorkOrderUpdateRequest $request, MaintenanceWorkOrder $maintenanceWorkOrder, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('update', $maintenanceWorkOrder);

        $validated = $request->validated();

        $maintenanceWorkOrder->update([
            'status' => $validated['status'],
            'actual_cost' => $validated['actual_cost'] ?? $maintenanceWorkOrder->actual_cost,
            'resolution_notes' => $validated['resolution_notes'] ?? null,
            'completed_at' => $validated['status'] === 'completed' ? now() : null,
        ]);

        if ($validated['status'] === 'completed' && $maintenanceWorkOrder->court && $maintenanceWorkOrder->court->status === 'maintenance') {
            $maintenanceWorkOrder->court->update(['status' => 'available']);
            event(new CourtStatusChanged($maintenanceWorkOrder->court->refresh()));
        }

        $timeline->record($maintenanceWorkOrder, 'maintenance.updated', 'Maintenance work order updated', [
            'organization_id' => $maintenanceWorkOrder->organization_id,
            'branch_id' => $maintenanceWorkOrder->branch_id,
            'description' => $validated['resolution_notes'] ?? null,
            'metadata' => ['status' => $maintenanceWorkOrder->status, 'actual_cost' => $maintenanceWorkOrder->actual_cost],
        ]);

        return back()->with('success', 'CourtPrime maintenance work order updated.');
    }

    private function nextReference(Branch $branch): string
    {
        [$startOfDay, $endOfDay] = $this->clock->dayRange(branch: $branch);
        $localDate = $this->clock->today($branch);

        return 'CP-MNT-'.$localDate->format('Ymd').'-'.str_pad((string) (MaintenanceWorkOrder::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count() + 1), 6, '0', STR_PAD_LEFT);
    }
}
