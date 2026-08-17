<?php

namespace App\Http\Controllers;

use App\Http\Requests\CourtStoreRequest;
use App\Models\Branch;
use App\Models\Court;
use App\Services\SubscriptionFeatureGate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CourtController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Court::class);

        return Inertia::render('courts', [
            'courts' => Court::query()
                ->with(['branch'])
                ->withCount('reservations')
                ->orderBy('branch_id')
                ->orderBy('court_number')
                ->get(),
            'branches' => Branch::query()->orderBy('name')->get(),
        ]);
    }

    public function store(CourtStoreRequest $request, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('create', Court::class);

        $validated = $request->validated();
        $branch = Branch::query()->findOrFail($validated['branch_id']);

        if (! $subscriptionGate->canCreateCourt($branch->organization)) {
            throw ValidationException::withMessages(['name' => 'This CourtPrime subscription has reached its court limit.']);
        }

        if (Court::query()->withoutGlobalScope('organization')->where('branch_id', $branch->id)->where('court_number', $validated['court_number'])->exists()) {
            throw ValidationException::withMessages(['court_number' => 'This court number already exists in the selected branch.']);
        }

        Court::query()->create([
            ...$validated,
            'organization_id' => $branch->organization_id,
            'branch_id' => $branch->id,
            'amenities' => collect(explode(',', (string) ($validated['amenities'] ?? '')))
                ->map(fn (string $amenity) => trim($amenity))
                ->filter()
                ->values()
                ->all(),
        ]);

        return back()->with('success', 'CourtPrime court created.');
    }
}
