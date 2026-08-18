<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchPhotoRequest;
use App\Models\Branch;
use App\Models\BranchPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Gallery management for a club's own venues.
 *
 * Authorisation runs against the Branch, not the photo: BranchPhoto carries no
 * organization_id, so TenantResourcePolicy cannot scope it, and "may manage
 * this venue" is the boundary that actually matters.
 */
class BranchPhotoController extends Controller
{
    public function store(BranchPhotoRequest $request, Branch $branch): RedirectResponse
    {
        $this->authorize('update', $branch);

        BranchPhoto::query()->create([
            'branch_id' => $branch->id,
            'path' => $request->file('photo')->store('branch-photos', 'public'),
            'caption' => $request->validated('caption'),
            'sort_order' => (int) BranchPhoto::query()->where('branch_id', $branch->id)->max('sort_order') + 1,
        ]);

        return back()->with('success', 'Gallery photo added.');
    }

    public function update(BranchPhotoRequest $request, Branch $branch, BranchPhoto $photo): RedirectResponse
    {
        $this->authorize('update', $branch);
        abort_unless($photo->branch_id === $branch->id, 404);

        $attributes = ['caption' => $request->validated('caption')];

        if ($request->hasFile('photo')) {
            $this->forgetUpload($photo->path);
            $attributes['path'] = $request->file('photo')->store('branch-photos', 'public');
        }

        $photo->update($attributes);

        return back()->with('success', 'Gallery photo updated.');
    }

    public function destroy(Branch $branch, BranchPhoto $photo): RedirectResponse
    {
        $this->authorize('update', $branch);
        abort_unless($photo->branch_id === $branch->id, 404);

        $this->forgetUpload($photo->path);
        $photo->delete();

        return back()->with('success', 'Gallery photo removed.');
    }

    /**
     * Delete an uploaded file, but never a bundled asset.
     *
     * Seeded galleries point at files under /public such as /cp-paddle2.png.
     * Passing those to Storage::delete would try to remove shipped artwork, so
     * only disk-relative uploads are touched.
     */
    private function forgetUpload(?string $path): void
    {
        if (! $path || Str::startsWith($path, ['http://', 'https://', '/'])) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
