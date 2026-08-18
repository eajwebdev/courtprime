<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayGuestJoinRequest;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\PlayerIdentityService;
use App\Support\OpenPlayBoardAccess;
use App\Support\OpenPlaySessionLog;
use Illuminate\Http\RedirectResponse;

/**
 * Walk-in join, no account required.
 *
 * Open play is a drop-in format: someone turns up at the desk, is handed the
 * session code and wants to play. Requiring them to register first is the one
 * thing guaranteed to stop that. They give a name, they are in the rotation,
 * and the identity service issues them a real CourtPrime profile in the
 * background — so their games count from the first one.
 *
 * Rate limited at the route, because this writes player records from
 * unauthenticated input.
 */
class PublicOpenPlayJoinController extends Controller
{
    public function store(
        OpenPlayGuestJoinRequest $request,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
        PlayerIdentityService $identity,
    ): RedirectResponse {
        $session = $openPlay->sessionForCode($request->string('code')->toString(), $request->string('key')->toString());

        $player = $identity->findOrCreateLocalPlayer((int) $session->organization_id, [
            'name' => $request->string('name')->toString(),
            'mobile_number' => $request->input('mobile_number'),
            'home_branch_id' => $session->branch_id,
        ]);

        $openPlay->join($session, $player);
        $openPlay->checkIn($session, $player);

        if ($session->status === 'live') {
            $rotation->generate($session);
        }

        /* Same pair the board gate asks for, so it opens the board as well. */
        OpenPlayBoardAccess::grant($request, $session, $player->name);
        $first = ! $session->organizer_token;
        OpenPlayBoardAccess::claimHost($request, $session);

        OpenPlaySessionLog::record(
            $request,
            $session,
            'open_play.player_joined',
            'Joined the session',
            $first ? 'First one in, running the board' : null,
        );

        return back()
            ->with('success', "You are in {$session->name}.")
            ->with('boardUrl', route('open-play.board.public', ['code' => $session->session_code]));
    }
}
