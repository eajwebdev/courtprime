<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupportTicketMessageStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:5000'],
            'internal' => ['required', 'boolean'],
            'status' => ['required', 'string', 'in:open,pending,waiting_on_customer,resolved,closed'],
        ];
    }
}
