<?php

namespace App\Http\Controllers;

use App\Models\OpenPlayPlayer;
use App\Models\OpenPlaySession;
use App\Services\OpenPlayService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where a player goes to get into tonight's rotation.
 *
 * A GET, and public, because this is what the session QR points at: a player
 * holds their camera up at the court, lands here, and the only thing on the
 * page is the session they are standing in and a button that puts them in the
 * queue. Nothing on it can take the board or change the session.
 *
 * Reached three ways, all the same screen:
 *   - scanning the club's QR, which carries the ID and key in the link
 *   - typing the pair the club read out
 *   - tapping through from the open play listing
 *
 * Signing in is required to actually join, and deliberately so: joining as
 * yourself is what makes the games land on your record rather than on a
 * club-side walk-in nobody owns. So a guest still sees the session first and is
 * asked to sign in second, rather than being bounced to a login form that
 * explains nothing.
 */
class PublicOpenPlayJoinController extends Controller
{
    public function show(Request $request, OpenPlayService $openPlay): Response
    {
        $code = trim((string) $request->query('code', ''));
        $key = trim((string) $request->query('key', ''));

        $session = null;
        $error = null;
        $alreadyJoined = false;

        if ($code !== '' && $key !== '') {
            try {
                $model = $openPlay->sessionForCode($code, $key);
                $session = $this->summarise($model);
                $alreadyJoined = $this->alreadyJoined($request, $model);
            } catch (ValidationException $exception) {
                /* The service throws one deliberately vague message for a bad
                   pair, a missing session and a finished one. Kept as it is:
                   this page is public and a QR can be photographed. */
                $error = $exception->validator->errors()->first('code');
            }
        }

        /*
         * So signing in comes back here rather than dropping them on their
         * dashboard holding a code they now have to type again. Laravel's
         * intended URL is the mechanism login already uses; there is no
         * ?redirect= parameter to add and none should be, it would be an open
         * redirect on a public page.
         */
        if ($session !== null && $request->user() === null) {
            redirect()->setIntendedUrl($request->fullUrl());
        }

        return Inertia::render('open-play-join', [
            'code' => strtoupper($code),
            /* Not 'key'. React reserves that name, so a prop called key never
               reaches the component and the join post went out without one. */
            'sessionKey' => strtoupper($key),
            'session' => $session,
            'error' => $error,
            /* So the page can join on arrival without posting again for
               somebody who is already in the queue. */
            'alreadyJoined' => $alreadyJoined,
        ]);
    }

    /**
     * Whether the signed-in player is already in this session.
     *
     * Read-only, and it never creates the club-side record that joining would:
     * simply looking at the page must not put anyone in a club's player list.
     */
    private function alreadyJoined(Request $request, OpenPlaySession $session): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        return OpenPlayPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->whereNull('withdrawn_at')
            ->whereHas('player', fn ($query) => $query
                ->withoutGlobalScope('organization')
                ->where('organization_id', $session->organization_id)
                ->where('email', $user->email))
            ->exists();
    }

    /**
     * What a player needs to recognise the session in front of them.
     *
     * Never the key. It arrived in the link that got them here and it is the
     * club's to hand out, so it is not echoed back into the page.
     *
     * @return array<string, mixed>
     */
    private function summarise(OpenPlaySession $session): array
    {
        $session->loadCount(['players', 'sessionCourts']);

        return [
            'name' => $session->name,
            'code' => $session->session_code,
            'status' => $session->status,
            'session_date' => $session->session_date?->toDateString(),
            'start_time' => substr((string) $session->start_time, 0, 5),
            'end_time' => substr((string) $session->end_time, 0, 5),
            'format' => $session->format,
            'entry_fee' => $session->entry_fee,
            'max_players' => $session->max_players,
            'players_count' => $session->players_count,
            'courts_count' => $session->session_courts_count,
            'branch' => $session->branch?->name,
            'organization' => $session->branch?->organization?->name,
            'organization_slug' => $session->branch?->organization?->slug,
        ];
    }
}
