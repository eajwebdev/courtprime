<?php

namespace App\Http\Controllers;

use App\Models\OpenPlayPlayer;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\PlayerIdentityService;
use App\Services\PlayerProfileResolver;
use App\Support\OpenPlaySessionLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * A player putting themselves into tonight's rotation.
 *
 * The board's own add-a-player is somebody at the desk typing a name, which
 * creates a club-side record for a person who may never sign in — a walk-in.
 * This is the other way round: a player who already has a CourtPrime account
 * enters the session ID and key from their phone and is in the queue as
 * themselves.
 *
 * The difference matters after the game. Results are credited to the network
 * profile behind the club-side player, reached through OrganizationPlayer, so
 * joining as yourself is what makes the win show up on your record and in the
 * rankings. Joining is done through the identity service for exactly that
 * reason: it matches on the email already on the account rather than making a
 * second person with the same name.
 *
 * Entering the pair here does not hand over the board. Running the session and
 * playing in it are different jobs, and the board is claimed at the board.
 */
class PlayerOpenPlayJoinController extends Controller
{
    public function store(
        Request $request,
        OpenPlayService $openPlay,
        PlayerProfileResolver $profiles,
        PlayerIdentityService $identity,
        OpenPlayRotationService $rotation,
    ): RedirectResponse {
        $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'key' => ['required', 'string', 'max:32'],
        ]);

        /* Throws the same single message for a wrong pair, a session that does
           not exist, and one that has ended — so this cannot be used to find
           out which. */
        $session = $openPlay->sessionForCode(
            $request->string('code')->toString(),
            $request->string('key')->toString(),
        );

        $profile = $profiles->forUser($request->user());

        /*
         * Their club-side record at this club, created if this is their first
         * visit. Matched on the email their account already carries, so the
         * games land on the profile they already have rather than on a second
         * one with the same name.
         */
        $organizationPlayer = $identity->findOrCreateOrganizationPlayer((int) $session->organization_id, [
            'name' => $profile->display_name ?: $request->user()->name,
            'email' => $profile->email ?: $request->user()->email,
            'mobile_number' => $profile->mobile_number,
            'skill_level' => $profile->skill_level ?: 'beginner',
            'home_branch_id' => $session->branch_id,
        ]);

        $player = $organizationPlayer->legacyPlayer;

        /*
         * Whether this is news, worked out before anything changes.
         *
         * The join itself is idempotent — tapping twice, or arriving while
         * already on a court, leaves them where they are — but the history is
         * not. Scanning the QR joins on arrival, and a player who reloads that
         * page or scans again at the next break would otherwise post "joined"
         * into the session history every time.
         */
        $isNew = ! OpenPlayPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $player->id)
            ->whereNull('withdrawn_at')
            ->exists();

        $openPlay->join($session, $player);
        $openPlay->checkIn($session, $player);

        if ($session->status === 'live') {
            $rotation->generate($session);
        }

        if ($isNew) {
            OpenPlaySessionLog::record($request, $session, 'open_play.player_joined', $player->name.' joined');
        }

        return back()->with(
            'success',
            $isNew
                ? "You are in the rotation for {$session->name}."
                : "You are already in the rotation for {$session->name}.",
        );
    }
}
