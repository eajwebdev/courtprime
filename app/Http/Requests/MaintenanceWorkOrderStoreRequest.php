<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class MaintenanceWorkOrderStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true || in_array($role?->value, ['front_desk', 'scorekeeper'], true);
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'court_id' => ['nullable', 'integer', 'exists:courts,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'string', 'in:low,normal,high,urgent'],
            'status' => ['required', 'string', 'in:open,scheduled,in_progress,completed,cancelled'],
            'scheduled_date' => ['nullable', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:3000'],
            'block_court' => ['nullable', 'boolean'],
        ];
    }
}
