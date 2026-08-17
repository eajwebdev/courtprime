<?php

namespace App\Http\Controllers;

use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WorkspaceController extends Controller
{
    public function update(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $validated = $request->validate([
            'organization_id' => ['required', 'integer', 'exists:organizations,id'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ]);

        if (! $tenantContext->canAccessOrganization((int) $validated['organization_id'])) {
            throw ValidationException::withMessages([
                'organization_id' => 'You are not authorized to use that CourtPrime workspace.',
            ]);
        }

        $request->session()->put('courtprime.workspace.organization_id', (int) $validated['organization_id']);
        $request->session()->put('courtprime.workspace.branch_id', isset($validated['branch_id']) ? (int) $validated['branch_id'] : null);

        return back();
    }
}
