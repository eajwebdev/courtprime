<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscriptionPlanFeatureStoreRequest;
use App\Http\Requests\SubscriptionPlanStoreRequest;
use App\Models\SubscriptionPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionPlanController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        return Inertia::render('subscription-plans', [
            'plans' => SubscriptionPlan::query()
                ->with(['features' => fn ($query) => $query->orderBy('feature_key')])
                ->withCount('subscriptions')
                ->orderBy('monthly_price')
                ->get(),
        ]);
    }

    public function store(SubscriptionPlanStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        SubscriptionPlan::query()->create([
            ...$validated,
            'code' => Str::upper(Str::slug($validated['code'], '_')),
        ]);

        return back()->with('success', 'CourtPrime subscription plan created.');
    }

    public function storeFeature(SubscriptionPlanFeatureStoreRequest $request, SubscriptionPlan $subscriptionPlan): RedirectResponse
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        $validated = $request->validated();
        $featureKey = Str::lower(Str::slug($validated['feature_key'], '_'));

        $subscriptionPlan->features()->updateOrCreate(
            ['feature_key' => $featureKey],
            [
                'label' => $validated['label'],
                'enabled' => $validated['enabled'],
                'limit_value' => $validated['limit_value'] ?? null,
            ],
        );

        return back()->with('success', 'CourtPrime plan feature saved.');
    }
}
