<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BranchPhoto extends Model
{
    protected $fillable = ['branch_id', 'path', 'caption', 'sort_order'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Public URL for the image.
     *
     * A path may be either an uploaded file on the public disk or a asset that
     * already lives under /public, so absolute and root-relative paths are
     * returned untouched.
     */
    public function getUrlAttribute(): string
    {
        $path = (string) $this->path;

        if (Str::startsWith($path, ['http://', 'https://', '/'])) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
