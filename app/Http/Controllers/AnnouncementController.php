<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnnouncementStoreRequest;
use App\Models\Announcement;
use App\Models\Branch;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', Announcement::class);

        $organizationId = $tenantContext->currentOrganizationId();

        return Inertia::render('announcements', [
            'announcements' => Announcement::query()
                ->with('branch')
                ->latest()
                ->paginate(15),
            'branches' => Branch::query()
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }

    public function store(AnnouncementStoreRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('create', Announcement::class);

        $organizationId = $tenantContext->currentOrganizationId();

        if (! $organizationId) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $validated = $request->validated();

        if (! empty($validated['branch_id'])) {
            $belongsToOrganization = Branch::query()
                ->withoutGlobalScope('organization')
                ->whereKey($validated['branch_id'])
                ->where('organization_id', $organizationId)
                ->exists();

            abort_unless($belongsToOrganization, 403);
        }

        Announcement::query()->create([
            'organization_id' => $organizationId,
            'branch_id' => $validated['branch_id'] ?? null,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'audience' => $validated['audience'],
            'status' => $validated['status'],
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'published_at' => $validated['status'] === 'published' ? now() : null,
        ]);

        return back()->with('success', 'CourtPrime announcement saved.');
    }
}
