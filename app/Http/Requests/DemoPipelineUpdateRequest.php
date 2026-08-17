<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DemoPipelineUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_superadmin;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:new,qualified,scheduled,proposal,converted,lost'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'follow_up_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
