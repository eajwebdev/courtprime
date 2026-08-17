<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class MaintenanceWorkOrderUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:open,scheduled,in_progress,completed,cancelled'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'resolution_notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
