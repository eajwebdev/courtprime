<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlayerProfileUpdateRequest;
use App\Models\PlayerProfile;
use App\Services\PlayerProfileResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PlayerProfileController extends Controller
{
    public function edit(Request $request, PlayerProfileResolver $profiles): Response
    {
        $profile = $profiles->forUser($request->user());

        return Inertia::render('player-profile', [
            'profile' => [
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
                'avatar_url' => $profile->avatar_url,
                'action_photo_url' => $profile->action_photo_url,
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'email' => $profile->email,
                'mobile_number' => $profile->mobile_number,
                'birthday' => $profile->birthday?->toDateString(),
                'gender' => $profile->gender,
                'home_city' => $profile->home_city,
                'preferred_playing_hand' => $profile->preferred_playing_hand,
                'preferred_match_type' => $profile->preferred_match_type,
                'skill_level' => $profile->skill_level,
                'global_rating' => $profile->global_rating,
                'verification_status' => $profile->verification_status,
                'privacy_settings' => array_merge([
                    'show_connected_clubs' => false,
                    'show_match_history' => true,
                    'show_rating' => true,
                    'show_city' => false,
                    'show_achievements' => true,
                ], $profile->privacy_settings ?? []),
            ],
        ]);
    }

    public function update(PlayerProfileUpdateRequest $request, PlayerProfileResolver $profiles): RedirectResponse
    {
        $profile = $profiles->forUser($request->user());
        $validated = $request->validated();

        $profile->update([
            'display_name' => $validated['display_name'],
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'mobile_number' => $validated['mobile_number'] ?? null,
            'birthday' => $validated['birthday'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'home_city' => $validated['home_city'] ?? null,
            'preferred_playing_hand' => $validated['preferred_playing_hand'] ?? null,
            'preferred_match_type' => $validated['preferred_match_type'] ?? null,
            'skill_level' => $validated['skill_level'],
            'privacy_settings' => [
                'show_connected_clubs' => $validated['show_connected_clubs'],
                'show_match_history' => $validated['show_match_history'],
                'show_rating' => $validated['show_rating'],
                'show_city' => $validated['show_city'],
                'show_achievements' => $validated['show_achievements'],
            ],
        ]);

        $this->syncPhoto($profile, 'avatar_path', $request->file('avatar'), $request->boolean('remove_avatar'), 'player-avatars');
        $this->syncPhoto($profile, 'action_photo_path', $request->file('action_photo'), $request->boolean('remove_action_photo'), 'player-action-photos');

        return back()->with('success', 'CourtPrime player profile saved.');
    }

    /**
     * Store a new photo, or clear the existing one, deleting whatever it
     * replaces so the disk does not accumulate orphans.
     */
    private function syncPhoto(
        PlayerProfile $profile,
        string $column,
        ?UploadedFile $file,
        bool $remove,
        string $directory,
    ): void {
        if (! $file && ! $remove) {
            return;
        }

        if ($profile->{$column}) {
            Storage::disk('public')->delete($profile->{$column});
        }

        $profile->update([
            $column => $file ? $file->store($directory, 'public') : null,
        ]);
    }
}
