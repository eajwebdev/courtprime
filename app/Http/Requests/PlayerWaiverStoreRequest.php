<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlayerWaiverStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'waiver_template_id' => ['nullable', 'integer', 'exists:waiver_templates,id'],
            'version' => ['required', 'string', 'max:50'],
            'signature_name' => ['required', 'string', 'max:255'],
            'guardian_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
