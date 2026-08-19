<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class OrganizationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'timezone' => ['required', 'string', 'max:80'],
            'currency' => ['required', 'string', 'size:3'],
            'booking_window_days' => ['required', 'integer', 'min:1', 'max:365'],
            'cancellation_cutoff_hours' => ['required', 'integer', 'min:0', 'max:168'],
            'default_deposit_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'require_deposit' => ['required', 'boolean'],
            'allow_public_booking' => ['required', 'boolean'],
            'player_privacy_mode' => ['required', 'string', 'in:strict,balanced,open'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            /* Off-site addresses the club controls, shown on its booking page. */
            'website' => ['nullable', 'url', 'max:255'],
            'facebook' => ['nullable', 'url', 'max:255'],
            'instagram' => ['nullable', 'url', 'max:255'],
            'tiktok' => ['nullable', 'url', 'max:255'],
            'primary_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'allow_white_label' => ['required', 'boolean'],
            'receipt_footer' => ['nullable', 'string', 'max:500'],
            'payment_methods' => ['required', 'array', 'min:1'],
            'payment_methods.*' => ['string', 'in:cash,card,gcash,maya,bank_transfer,wallet,other'],
            'membership_auto_renewal' => ['required', 'boolean'],
            'send_email_notifications' => ['required', 'boolean'],
            'send_sms_notifications' => ['required', 'boolean'],
            'send_push_notifications' => ['required', 'boolean'],
            'live_display_branding' => ['nullable', 'string', 'max:255'],
            'live_display_rotation_seconds' => ['required', 'integer', 'min:5', 'max:120'],
            'live_display_announcement' => ['nullable', 'string', 'max:500'],
            'live_display_token_required' => ['required', 'boolean'],
            'live_display_token' => ['nullable', 'string', 'min:12', 'max:100'],
            'payment_gateway' => ['nullable', 'string', 'max:100'],
            'sms_gateway' => ['nullable', 'string', 'max:100'],
            'email_provider' => ['nullable', 'string', 'max:100'],
            'api_access_enabled' => ['required', 'boolean'],
        ];
    }
}
