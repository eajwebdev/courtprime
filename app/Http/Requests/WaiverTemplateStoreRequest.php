<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class WaiverTemplateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'version' => ['required', 'string', 'max:50'],
            'body' => ['required', 'string', 'max:10000'],
            'required_before_booking' => ['nullable', 'boolean'],
            'status' => ['required', 'string', 'in:active,inactive,archived'],
        ];
    }
}
