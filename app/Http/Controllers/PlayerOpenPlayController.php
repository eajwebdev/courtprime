<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayJoinByCodeRequest;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\PlayerIdentityService;
use App\Services\PlayerProfileResolver;
use Illuminate\Http\RedirectResponse;

/**
 * Players joining an open play session themselves with the code the club gave
 * them. No staff step and no manual queue entry.
 *
 * The club-local Player record is resolved through the existing identity
 * service, which is the same path a walk-in booking takes — joining a session
 * at a club you have never played at connects you to it exactly as booking a
 * court there would.
 */
class PlayerOpenPlayController extends Controller
{
    public function store(
        OpenPlayJoinByCodeRequest $request,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
        PlayerProfileResolver $profiles,
        PlayerIdentityService $identity,
    ): RedirectResponse {
        $session = $openPlay->sessionForCode($request->string('code')->toString(), $request->string('key')->toString());
        $profile = $profiles->forUser($request->user());

        $player = $identity->findOrCreateLocalPlayer((int) $session->organization_id, [
            'name' => $profile->display_name,
            'email' => $profile->email,
            'mobile_number' => $profile->mobile_number,
            'skill_level' => $profile->skill_level,
            'home_branch_id' => $session->branch_id,
        ]);

        $openPlay->join($session, $player);
        $openPlay->checkIn($session, $player);

        /* The arrival that makes four is a match. */
        $rotation->generate($session);

        return back()->with('success', "You are in {$session->name}. Watch the board for your court.");
    }
}
