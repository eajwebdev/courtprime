<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupportTicketStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:general,billing,technical,feature_request,account,incident'],
            'priority' => ['required', 'string', 'in:low,normal,high,urgent'],
            'body' => ['required', 'string', 'max:5000'],
        ];
    }
}
