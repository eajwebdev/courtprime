<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseStoreRequest;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\User;
use App\Services\ActivityTimelineService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', Expense::class);

        $organizationId = $tenantContext->currentOrganizationId();
        $branchId = $tenantContext->currentBranchId();

        return Inertia::render('expenses', [
            'expenses' => Expense::query()
                ->with(['branch:id,name,code', 'approver:id,name'])
                ->latest('expense_date')
                ->paginate(20),
            'branches' => Branch::query()->when($branchId, fn ($query) => $query->whereKey($branchId))->orderBy('name')->get(['id', 'name', 'code']),
            'approvers' => User::query()
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->orderBy('name')
                ->get(['id', 'name', 'role_key']),
            'metrics' => [
                'month' => (float) Expense::query()->whereBetween('expense_date', [today()->startOfMonth(), today()->endOfMonth()])->sum('amount'),
                'pending' => (float) Expense::query()->where('status', 'pending')->sum('amount'),
                'approved' => (float) Expense::query()->where('status', 'approved')->sum('amount'),
                'paid' => (float) Expense::query()->where('status', 'paid')->sum('amount'),
            ],
            'categoryTotals' => Expense::query()
                ->selectRaw('category, sum(amount) as total')
                ->groupBy('category')
                ->orderByDesc('total')
                ->get(),
        ]);
    }

    public function store(ExpenseStoreRequest $request, TenantContext $tenantContext, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('create', Expense::class);

        $validated = $request->validated();
        $branchId = $tenantContext->currentBranchId();

        if ($branchId && (! isset($validated['branch_id']) || (int) $validated['branch_id'] !== $branchId)) {
            throw ValidationException::withMessages(['branch_id' => 'Select the active branch workspace before recording this expense.']);
        }

        $approved = in_array($validated['status'], ['approved', 'paid'], true);

        $expense = Expense::query()->create([
            ...$validated,
            'organization_id' => $tenantContext->currentOrganizationId(),
            'created_by' => $request->user()->id,
            'approved_by' => $validated['approved_by'] ?? ($approved ? $request->user()->id : null),
            'approved_at' => $approved ? now() : null,
        ]);

        $timeline->record($expense, 'expense.recorded', 'Expense recorded', [
            'organization_id' => $expense->organization_id,
            'branch_id' => $expense->branch_id,
            'description' => $expense->supplier,
            'metadata' => ['category' => $expense->category, 'amount' => $expense->amount, 'status' => $expense->status],
        ]);

        return back()->with('success', 'CourtPrime expense recorded.');
    }
}
