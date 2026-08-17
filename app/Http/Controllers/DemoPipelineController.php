<?php

namespace App\Http\Controllers;

use App\Http\Requests\DemoLeadConvertRequest;
use App\Http\Requests\DemoPipelineUpdateRequest;
use App\Models\DemoRequest;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DemoPipelineController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        return Inertia::render('demo-pipeline', [
            'requests' => DemoRequest::query()
                ->with(['assignee:id,name,email', 'convertedOrganization:id,name,slug,status'])
                ->latest()
                ->paginate(20),
            'assignees' => User::query()
                ->where('is_superadmin', true)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'plans' => SubscriptionPlan::query()
                ->where('is_active', true)
                ->orderBy('monthly_price')
                ->get(['id', 'name', 'code', 'monthly_price']),
            'metrics' => [
                'new' => DemoRequest::query()->where('status', 'new')->count(),
                'scheduled' => DemoRequest::query()->where('status', 'scheduled')->count(),
                'proposal' => DemoRequest::query()->where('status', 'proposal')->count(),
                'converted' => DemoRequest::query()->where('status', 'converted')->count(),
            ],
        ]);
    }

    public function update(DemoPipelineUpdateRequest $request, DemoRequest $demoRequest): RedirectResponse
    {
        $demoRequest->update($request->validated());

        return back()->with('success', 'CourtPrime demo pipeline updated.');
    }

    public function convert(DemoLeadConvertRequest $request, DemoRequest $demoRequest): RedirectResponse
    {
        if ($demoRequest->converted_organization_id) {
            throw ValidationException::withMessages(['subscription_plan_id' => 'This demo request is already converted.']);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($demoRequest, $validated) {
            $organization = Organization::query()->create([
                'name' => $demoRequest->business_name,
                'slug' => $this->organizationSlug($demoRequest->business_name),
                'owner_name' => $demoRequest->contact_person,
                'email' => $demoRequest->email,
                'phone' => $demoRequest->mobile_number,
                'status' => 'trial',
                'settings' => [
                    'source' => 'demo_pipeline',
                    'demo_reference' => $demoRequest->reference,
                    'estimated_branches' => $demoRequest->branches_count,
                    'estimated_courts' => $demoRequest->courts_count,
                    'features_needed' => $demoRequest->features_needed ?? [],
                ],
            ]);

            Subscription::query()->create([
                'organization_id' => $organization->id,
                'subscription_plan_id' => $validated['subscription_plan_id'],
                'status' => 'trial',
                'billing_cycle' => $validated['billing_cycle'],
                'trial_ends_at' => $validated['trial_ends_at'] ?? now()->addDays(14),
                'current_period_starts_at' => now(),
            ]);

            $demoRequest->update([
                'status' => 'converted',
                'converted_organization_id' => $organization->id,
                'converted_at' => now(),
            ]);
        });

        return back()->with('success', 'CourtPrime tenant created from demo request.');
    }

    private function organizationSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'courtprime-tenant';

        for ($attempt = 0; $attempt < 20; $attempt++) {
            $slug = $attempt === 0 ? $base : "{$base}-{$attempt}";

            if (! Organization::query()->where('slug', $slug)->exists()) {
                return $slug;
            }
        }

        return $base.'-'.Str::lower(Str::random(6));
    }
}
