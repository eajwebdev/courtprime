<?php

namespace App\Http\Controllers;

use App\Http\Requests\StaffAttendanceStoreRequest;
use App\Http\Requests\StaffProfileStoreRequest;
use App\Models\Branch;
use App\Models\StaffAttendanceEntry;
use App\Models\StaffProfile;
use App\Models\User;
use App\Services\ActivityTimelineService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', StaffProfile::class);

        $organizationId = $tenantContext->currentOrganizationId();
        $branchId = $tenantContext->currentBranchId();

        return Inertia::render('staff', [
            'canManageStaff' => $tenantContext->activeRole()?->canManageTenant() === true,
            'profiles' => StaffProfile::query()
                ->with(['branch:id,name,code', 'user:id,name,email', 'attendanceEntries' => fn ($query) => $query->latest('attendance_date')->limit(3)])
                ->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))
                ->latest()
                ->paginate(20),
            'branches' => Branch::query()
                ->when($branchId, fn ($query) => $query->whereKey($branchId))
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'users' => User::query()
                ->when($organizationId, fn ($query) => $query->where(fn ($query) => $query->whereNull('organization_id')->orWhere('organization_id', $organizationId)))
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role_key']),
            'attendance' => StaffAttendanceEntry::query()
                ->with(['staffProfile:id,name,employee_id', 'branch:id,name,code'])
                ->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))
                ->whereDate('attendance_date', today())
                ->latest()
                ->limit(20)
                ->get(),
            'metrics' => [
                'active' => StaffProfile::query()->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))->where('status', 'active')->count(),
                'onLeave' => StaffProfile::query()->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))->where('status', 'on_leave')->count(),
                'todayPresent' => StaffAttendanceEntry::query()->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))->whereDate('attendance_date', today())->whereIn('status', ['present', 'late', 'half_day', 'remote'])->count(),
                'lateToday' => StaffAttendanceEntry::query()->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))->whereDate('attendance_date', today())->where('status', 'late')->count(),
            ],
        ]);
    }

    public function storeProfile(StaffProfileStoreRequest $request, TenantContext $tenantContext, ActivityTimelineService $timeline): RedirectResponse
    {
        $this->authorize('create', StaffProfile::class);

        $validated = $request->validated();
        $branchId = $this->branchId($validated['branch_id'] ?? null, $tenantContext);

        $profile = StaffProfile::query()->create([
            ...$validated,
            'organization_id' => $tenantContext->currentOrganizationId(),
            'branch_id' => $branchId,
        ]);

        $timeline->record($profile, 'staff.created', 'Staff profile created', [
            'organization_id' => $profile->organization_id,
            'branch_id' => $profile->branch_id,
            'description' => $profile->position,
            'metadata' => ['employee_id' => $profile->employee_id, 'status' => $profile->status],
        ]);

        return back()->with('success', 'CourtPrime staff profile saved.');
    }

    public function storeAttendance(StaffAttendanceStoreRequest $request, TenantContext $tenantContext, ActivityTimelineService $timeline): RedirectResponse
    {
        $validated = $request->validated();
        $profile = StaffProfile::query()->findOrFail($validated['staff_profile_id']);

        $this->authorize('update', $profile);

        $branchId = $this->branchId($validated['branch_id'] ?? $profile->branch_id, $tenantContext);

        $entry = StaffAttendanceEntry::query()->create([
            ...$validated,
            'organization_id' => $profile->organization_id,
            'branch_id' => $branchId,
            'recorded_by' => $request->user()->id,
        ]);

        $timeline->record($profile, 'staff.attendance', 'Staff attendance recorded', [
            'related' => $entry,
            'organization_id' => $entry->organization_id,
            'branch_id' => $entry->branch_id,
            'description' => $entry->notes,
            'metadata' => ['status' => $entry->status, 'time_in' => $entry->time_in, 'time_out' => $entry->time_out],
        ]);

        return back()->with('success', 'CourtPrime attendance entry recorded.');
    }

    private function branchId(int|string|null $branchId, TenantContext $tenantContext): ?int
    {
        $activeBranchId = $tenantContext->currentBranchId();

        if ($activeBranchId && (! $branchId || (int) $branchId !== $activeBranchId)) {
            throw ValidationException::withMessages(['branch_id' => 'Select the active branch workspace before saving this staff record.']);
        }

        if (! $branchId) {
            return null;
        }

        $exists = Branch::query()
            ->withoutGlobalScope('organization')
            ->whereKey((int) $branchId)
            ->where('organization_id', $tenantContext->currentOrganizationId())
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages(['branch_id' => 'Select a branch inside the active organization.']);
        }

        return (int) $branchId;
    }
}
