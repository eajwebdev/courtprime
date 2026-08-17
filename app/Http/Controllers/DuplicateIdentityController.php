<?php

namespace App\Http\Controllers;

use App\Models\PlayerProfile;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DuplicateIdentityController extends Controller
{
    public function __invoke(): Response
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        $profiles = PlayerProfile::query()
            ->with(['organizationPlayers.organization:id,name'])
            ->where(function ($query) {
                $query->whereNotNull('email')->orWhereNotNull('mobile_number');
            })
            ->orderBy('display_name')
            ->get();

        $groups = collect()
            ->merge($this->groups($profiles, 'email', 'Email'))
            ->merge($this->groups($profiles, 'mobile_number', 'Mobile'))
            ->values();

        return Inertia::render('duplicate-identities', [
            'groups' => $groups,
            'metrics' => [
                'groups' => $groups->count(),
                'profiles' => $groups->sum(fn (array $group) => count($group['profiles'])),
            ],
        ]);
    }

    private function groups($profiles, string $field, string $label)
    {
        return $profiles
            ->filter(fn (PlayerProfile $profile) => filled($profile->{$field}))
            ->groupBy(fn (PlayerProfile $profile) => Str::lower((string) $profile->{$field}))
            ->filter(fn ($group) => $group->count() > 1)
            ->map(fn ($group, string $value) => [
                'type' => $label,
                'value' => $value,
                'profiles' => $group->map(fn (PlayerProfile $profile) => [
                    'id' => $profile->id,
                    'courtprime_player_id' => $profile->courtprime_player_id,
                    'display_name' => $profile->display_name,
                    'email' => $profile->email,
                    'mobile_number' => $profile->mobile_number,
                    'verification_status' => $profile->verification_status,
                    'global_rating' => $profile->global_rating,
                    'organizations' => $profile->organizationPlayers
                        ->map(fn ($organizationPlayer) => $organizationPlayer->organization?->name)
                        ->filter()
                        ->values(),
                ])->values(),
            ]);
    }
}
