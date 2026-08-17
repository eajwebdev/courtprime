<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductCategory extends Model
{
    use BelongsToOrganization;

    protected $fillable = ['organization_id', 'name'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
