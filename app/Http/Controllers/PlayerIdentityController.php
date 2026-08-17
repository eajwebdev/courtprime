<?php

namespace App\Http\Controllers;

use App\Http\Requests\CrmNoteStoreRequest;
use App\Http\Requests\PlayerAchievementStoreRequest;
use App\Http\Requests\PlayerPrivacyRequest;
use App\Http\Requests\PlayerWaiverStoreRequest;
use App\Models\ActivityTimelineEvent;
use App\Models\CrmNote;
use App\Models\OrganizationPlayer;
use App\Models\PlayerAchievement;
use App\Models\PlayerMembership;
use App\Models\PlayerProfile;
use App\Models\PlayerWaiver;
use App\Models\Tournament;
use App\Models\WaiverTemplate;
use App\Services\ActivityTimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlayerIdentityController extends Controller
{
    public function show(OrganizationPlayer $organizationPlayer): Response
    {
        $organizationPlayer->load(['playerProfile.user', 'organization', 'homeBranch', 'legacyPlayer']);
        $profile = $organizationPlayer->playerProfile;
        $canManageCustomer = $this->canManageCustomer($organizationPlayer);

        if (! $canManageCustomer && ! $this->canUpdatePrivacy($profile, request()) && ! $this->canClaim($profile, request())) {
            $this->authorize('view', $organizationPlayer);
        }

        return Inertia::render('player-identity', [
            'organizationPlayer' => [
                'id' => $organizationPlayer->id,
                'local_player_number' => $organizationPlayer->local_player_number,
                'status' => $organizationPlayer->status,
                'organization_skill_level' => $organizationPlayer->organization_skill_level,
                'first_visit_at' => $organizationPlayer->first_visit_at?->toDateString(),
                'last_visit_at' => $organizationPlayer->last_visit_at?->toDateString(),
                'organization' => [
                    'id' => $organizationPlayer->organization?->id,
                    'name' => $organizationPlayer->organization?->name,
                ],
                'home_branch' => $organizationPlayer->homeBranch ? [
                    'id' => $organizationPlayer->homeBranch->id,
                    'name' => $organizationPlayer->homeBranch->name,
                ] : null,
            ],
            'profile' => $this->profilePayload($profile),
            'identityUrl' => route('player-identities.public', $profile->courtprime_player_id),
            'qrIdentityUrl' => $this->qrIdentityUrl($profile),
            'canClaim' => $this->canClaim($profile, request()),
            'canUpdatePrivacy' => $this->canUpdatePrivacy($profile, request()),
            'canManageCustomer' => $canManageCustomer,
            'memberships' => PlayerMembership::query()
                ->withoutGlobalScope('organization')
                ->with('plan')
                ->where('organization_player_id', $organizationPlayer->id)
                ->latest()
                ->get()
                ->map(fn (PlayerMembership $membership) => [
                    'id' => $membership->id,
                    'plan' => $membership->plan?->name,
                    'status' => $membership->status,
                    'starts_on' => $membership->starts_on?->toDateString(),
                    'ends_on' => $membership->ends_on?->toDateString(),
                    'auto_renew' => $membership->auto_renew,
                ]),
            'waivers' => PlayerWaiver::query()
                ->withoutGlobalScope('organization')
                ->with('template:id,title,version')
                ->where('organization_player_id', $organizationPlayer->id)
                ->latest()
                ->get()
                ->map(fn (PlayerWaiver $waiver) => [
                    'id' => $waiver->id,
                    'template' => $waiver->template ? [
                        'id' => $waiver->template->id,
                        'title' => $waiver->template->title,
                        'version' => $waiver->template->version,
                    ] : null,
                    'version' => $waiver->version,
                    'signature_name' => $waiver->signature_name,
                    'guardian_name' => $waiver->guardian_name,
                    'status' => $waiver->status,
                    'accepted_at' => $waiver->accepted_at?->toDateTimeString(),
                ]),
            'waiverTemplates' => WaiverTemplate::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $organizationPlayer->organization_id)
                ->where('status', 'active')
                ->latest()
                ->get(['id', 'title', 'version', 'required_before_booking']),
            'crmNotes' => $canManageCustomer
                ? CrmNote::query()
                    ->withoutGlobalScope('organization')
                    ->with('creator:id,name')
                    ->where('organization_player_id', $organizationPlayer->id)
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->map(fn (CrmNote $note) => [
                        'id' => $note->id,
                        'note_type' => $note->note_type,
                        'visibility' => $note->visibility,
                        'body' => $note->body,
                        'follow_up_at' => $note->follow_up_at?->toDateTimeString(),
                        'created_at' => $note->created_at?->toDateTimeString(),
                        'creator' => $note->creator?->name,
                    ])
                : [],
            'achievements' => PlayerAchievement::query()
                ->with(['organization:id,name', 'tournament:id,name'])
                ->where('player_profile_id', $profile->id)
                ->where(function ($query) use ($organizationPlayer) {
                    $query->where('visibility', 'public')
                        ->orWhere('organization_id', $organizationPlayer->organization_id);
                })
                ->latest('earned_at')
                ->get()
                ->map(fn (PlayerAchievement $achievement) => $this->achievementPayload($achievement)),
            'timeline' => ActivityTimelineEvent::query()
                ->with('actor:id,name')
                ->where(function ($query) use ($organizationPlayer, $profile) {
                    $query->where(fn ($query) => $query->where('subject_type', OrganizationPlayer::class)->where('subject_id', $organizationPlayer->id))
                        ->orWhere(fn ($query) => $query->where('subject_type', PlayerProfile::class)->where('subject_id', $profile->id))
                        ->orWhere(fn ($query) => $query->where('related_type', PlayerProfile::class)->where('related_id', $profile->id));
                })
                ->latest('occurred_at')
                ->limit(20)
                ->get()
                ->map(fn (ActivityTimelineEvent $event) => [
                    'id' => $event->id,
                    'event_type' => $event->event_type,
                    'title' => $event->title,
                    'description' => $event->description,
                    'visibility' => $event->visibility,
                    'occurred_at' => $event->occurred_at?->toDateTimeString(),
                    'actor' => $event->actor?->name,
                ]),
        ]);
    }

    public function publicProfile(string $courtprimePlayerId): Response
    {
        $profile = PlayerProfile::query()
            ->where('courtprime_player_id', $courtprimePlayerId)
            ->where('status', 'active')
            ->firstOrFail();

        return $this->renderPublicProfile($profile);
    }

    public function qrProfile(Request $request, string $courtprimePlayerId): Response
    {
        $profile = PlayerProfile::query()
            ->where('courtprime_player_id', $courtprimePlayerId)
            ->where('status', 'active')
            ->firstOrFail();

        abort_unless((int) $request->query('version') === (int) ($profile->qr_token_version ?? 1), 403);

        return $this->renderPublicProfile($profile, qrVerified: true);
    }

    private function renderPublicProfile(PlayerProfile $profile, bool $qrVerified = false): Response
    {
        $privacy = $this->privacy($profile);

        return Inertia::render('public-player-identity', [
            'profile' => [
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
                'avatar_url' => $profile->avatar_url,
                'action_photo_url' => $profile->action_photo_url,
                'skill_level' => $profile->skill_level,
                'home_city' => $privacy['show_city'] ? $profile->home_city : null,
                'global_rating' => $privacy['show_rating'] ? $profile->global_rating : null,
                'global_match_count' => $privacy['show_match_history'] ? $profile->global_match_count : null,
                'verification_status' => $profile->verification_status,
                'qr_verified' => $qrVerified,
                'connected_clubs' => $privacy['show_connected_clubs']
                    ? $profile->organizationPlayers()
                        ->withoutGlobalScope('organization')
                        ->with('organization:id,name')
                        ->where('status', 'active')
                        ->limit(12)
                        ->get()
                        ->map(fn (OrganizationPlayer $organizationPlayer) => $organizationPlayer->organization?->name)
                        ->filter()
                        ->values()
                    : [],
                'achievements' => $privacy['show_achievements']
                    ? $profile->achievements()
                        ->with(['organization:id,name', 'tournament:id,name'])
                        ->where('visibility', 'public')
                        ->latest('earned_at')
                        ->limit(12)
                        ->get()
                        ->map(fn (PlayerAchievement $achievement) => $this->achievementPayload($achievement))
                    : [],
            ],
        ]);
    }

    public function claim(OrganizationPlayer $organizationPlayer, Request $request, ActivityTimelineService $timeline): RedirectResponse
    {
        $profile = $organizationPlayer->playerProfile;

        if ($profile->user_id) {
            throw ValidationException::withMessages(['claim' => 'This CourtPrime identity is already claimed.']);
        }

        if (! $this->canClaim($profile, $request)) {
            throw ValidationException::withMessages(['claim' => 'Your login email must match this CourtPrime profile before it can be claimed.']);
        }

        $profile->update([
            'user_id' => $request->user()->id,
            'verification_status' => 'verified',
        ]);

        $timeline->record($profile, 'player.claimed', 'CourtPrime identity claimed', [
            'organization_id' => $organizationPlayer->organization_id,
            'branch_id' => $organizationPlayer->home_branch_id,
            'related' => $organizationPlayer,
            'visibility' => 'team',
        ]);

        return back()->with('success', 'CourtPrime identity claimed.');
    }

    public function updatePrivacy(PlayerPrivacyRequest $request, OrganizationPlayer $organizationPlayer, ActivityTimelineService $timeline): RedirectResponse
    {
        $profile = $organizationPlayer->playerProfile;

        if (! $this->canUpdatePrivacy($profile, $request)) {
            abort(403);
        }

        $profile->update([
            'privacy_settings' => array_merge($this->privacy($profile), $request->validated()),
        ]);

        $timeline->record($profile, 'player.privacy.updated', 'Player privacy updated', [
            'organization_id' => $organizationPlayer->organization_id,
            'branch_id' => $organizationPlayer->home_branch_id,
            'related' => $organizationPlayer,
            'visibility' => 'team',
            'metadata' => $request->validated(),
        ]);

        return back()->with('success', 'CourtPrime identity privacy saved.');
    }

    public function rotateQr(Request $request, OrganizationPlayer $organizationPlayer): RedirectResponse
    {
        $profile = $organizationPlayer->playerProfile;

        if (! $this->canManageCustomer($organizationPlayer) && ! $this->canUpdatePrivacy($profile, $request)) {
            abort(403);
        }

        $profile->update([
            'qr_token_version' => ((int) ($profile->qr_token_version ?? 1)) + 1,
            'qr_token_rotated_at' => now(),
        ]);

        return back()->with('success', 'CourtPrime QR identity rotated.');
    }

    public function storeWaiver(PlayerWaiverStoreRequest $request, OrganizationPlayer $organizationPlayer, ActivityTimelineService $timeline): RedirectResponse
    {
        $profile = $organizationPlayer->playerProfile;

        if (! $this->canManageCustomer($organizationPlayer) && ! $this->canUpdatePrivacy($profile, $request)) {
            abort(403);
        }

        $validated = $request->validated();
        $template = null;

        if (! empty($validated['waiver_template_id'])) {
            $template = WaiverTemplate::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $organizationPlayer->organization_id)
                ->where('status', 'active')
                ->findOrFail($validated['waiver_template_id']);
        }

        $waiver = PlayerWaiver::query()->create([
            'organization_id' => $organizationPlayer->organization_id,
            'organization_player_id' => $organizationPlayer->id,
            'player_profile_id' => $profile->id,
            'waiver_template_id' => $template?->id,
            'version' => $template?->version ?? $validated['version'],
            'signature_name' => $validated['signature_name'],
            'guardian_name' => $validated['guardian_name'] ?? null,
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        $timeline->record($organizationPlayer, 'player.waiver.accepted', 'Player waiver accepted', [
            'related' => $waiver,
            'organization_id' => $organizationPlayer->organization_id,
            'branch_id' => $organizationPlayer->home_branch_id,
            'description' => $template?->title ?? $validated['version'],
            'visibility' => 'team',
        ]);

        return back()->with('success', 'CourtPrime waiver recorded.');
    }

    public function storeCrmNote(CrmNoteStoreRequest $request, OrganizationPlayer $organizationPlayer, ActivityTimelineService $timeline): RedirectResponse
    {
        abort_unless($this->canManageCustomer($organizationPlayer), 403);

        $validated = $request->validated();

        $note = CrmNote::query()->create([
            'organization_id' => $organizationPlayer->organization_id,
            'organization_player_id' => $organizationPlayer->id,
            'player_profile_id' => $organizationPlayer->player_profile_id,
            'created_by' => $request->user()->id,
            'note_type' => $validated['note_type'],
            'visibility' => $validated['visibility'],
            'body' => $validated['body'],
            'follow_up_at' => $validated['follow_up_at'] ?? null,
        ]);

        $timeline->record($organizationPlayer, 'player.crm_note.created', 'Private CRM note saved', [
            'related' => $note,
            'organization_id' => $organizationPlayer->organization_id,
            'branch_id' => $organizationPlayer->home_branch_id,
            'description' => $validated['body'],
            'visibility' => $validated['visibility'],
            'metadata' => ['note_type' => $validated['note_type'], 'follow_up_at' => $validated['follow_up_at'] ?? null],
        ]);

        return back()->with('success', 'Private CourtPrime CRM note saved.');
    }

    public function storeAchievement(PlayerAchievementStoreRequest $request, OrganizationPlayer $organizationPlayer, ActivityTimelineService $timeline): RedirectResponse
    {
        abort_unless($this->canManageCustomer($organizationPlayer), 403);

        $validated = $request->validated();
        $tournamentId = $validated['tournament_id'] ?? null;

        if ($tournamentId) {
            $belongsToOrganization = Tournament::query()
                ->withoutGlobalScope('organization')
                ->where('id', $tournamentId)
                ->where('organization_id', $organizationPlayer->organization_id)
                ->exists();

            abort_unless($belongsToOrganization, 403);
        }

        $code = Str::slug($validated['code'] ?? $validated['title']);
        $code = $code ?: 'achievement';

        $achievement = PlayerAchievement::query()->updateOrCreate(
            [
                'player_profile_id' => $organizationPlayer->player_profile_id,
                'organization_id' => $organizationPlayer->organization_id,
                'code' => $code,
            ],
            [
                'tournament_id' => $tournamentId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'badge_color' => $validated['badge_color'],
                'visibility' => $validated['visibility'],
                'earned_at' => $validated['earned_at'] ?? now(),
            ],
        );

        $timeline->record($organizationPlayer, 'player.achievement.awarded', 'Player achievement awarded', [
            'related' => $achievement,
            'organization_id' => $organizationPlayer->organization_id,
            'branch_id' => $organizationPlayer->home_branch_id,
            'description' => $achievement->title,
            'visibility' => $achievement->visibility,
        ]);

        return back()->with('success', 'CourtPrime achievement saved.');
    }

    private function profilePayload(PlayerProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'courtprime_player_id' => $profile->courtprime_player_id,
            'display_name' => $profile->display_name,
            'avatar_url' => $profile->avatar_url,
            'action_photo_url' => $profile->action_photo_url,
            'email' => $profile->email,
            'mobile_number' => $profile->mobile_number,
            'home_city' => $profile->home_city,
            'skill_level' => $profile->skill_level,
            'global_rating' => $profile->global_rating,
            'global_match_count' => $profile->global_match_count,
            'wins' => $profile->wins,
            'losses' => $profile->losses,
            'verification_status' => $profile->verification_status,
            'status' => $profile->status,
            'qr_token_version' => $profile->qr_token_version ?? 1,
            'qr_token_rotated_at' => $profile->qr_token_rotated_at?->toDateTimeString(),
            'privacy_settings' => $this->privacy($profile),
            'claimed_by' => $profile->user ? [
                'id' => $profile->user->id,
                'name' => $profile->user->name,
                'email' => $profile->user->email,
            ] : null,
        ];
    }

    private function canClaim(PlayerProfile $profile, Request $request): bool
    {
        $user = $request->user();

        if (! $user || $profile->user_id) {
            return false;
        }

        return $user->is_superadmin || ($profile->email && Str::lower($profile->email) === Str::lower($user->email));
    }

    private function canUpdatePrivacy(PlayerProfile $profile, Request $request): bool
    {
        $user = $request->user();

        return (bool) $user && ($user->is_superadmin || (int) $profile->user_id === (int) $user->id);
    }

    private function canManageCustomer(OrganizationPlayer $organizationPlayer): bool
    {
        return Gate::allows('view', $organizationPlayer);
    }

    private function privacy(PlayerProfile $profile): array
    {
        return array_merge([
            'show_connected_clubs' => false,
            'show_match_history' => true,
            'show_rating' => true,
            'show_city' => false,
            'show_achievements' => true,
        ], $profile->privacy_settings ?? []);
    }

    private function achievementPayload(PlayerAchievement $achievement): array
    {
        return [
            'id' => $achievement->id,
            'code' => $achievement->code,
            'title' => $achievement->title,
            'description' => $achievement->description,
            'badge_color' => $achievement->badge_color,
            'visibility' => $achievement->visibility,
            'earned_at' => $achievement->earned_at?->toDateString(),
            'organization' => $achievement->organization?->name,
            'tournament' => $achievement->tournament?->name,
        ];
    }

    private function qrIdentityUrl(PlayerProfile $profile): string
    {
        return URL::temporarySignedRoute(
            'player-identities.qr',
            now()->addYear(),
            [
                'courtprimePlayerId' => $profile->courtprime_player_id,
                'version' => $profile->qr_token_version ?? 1,
            ],
        );
    }
}
