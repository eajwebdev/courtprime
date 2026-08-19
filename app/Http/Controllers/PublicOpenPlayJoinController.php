<?php

namespace App\Http\Controllers;

use App\Services\OpenPlayService;
use App\Support\OpenPlayBoardAccess;
use App\Support\OpenPlaySessionLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Opening a board from the discovery page.
 *
 * The same pair the board gate asks for, taken from wherever the person is
 * already standing, so they do not have to find the gate first. It hands back
 * the board's URL rather than redirecting, because the board belongs in its own
 * tab: it is the thing propped up at the net for the next two hours.
 *
 * This used to add whoever entered the pair to the rotation, under the
 * assumption that a person with the code wanted to play. They usually do not,
 * they are running the session, and they were ending up in the queue as a
 * player who never turned up.
 *
 * Rate limited at the route, because it is unauthenticated.
 */
class PublicOpenPlayJoinController extends Controller
{
    public function store(Request $request, OpenPlayService $openPlay): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'key' => ['required', 'string', 'max:32'],
        ]);

        $session = $openPlay->sessionForCode($request->string('code')->toString(), $request->string('key')->toString());

        if (! OpenPlayBoardAccess::claim($request, $session, $request->user()?->name)) {
            return back()->withErrors([
                'code' => 'This board is open on another device. It has to be released there before it can be opened here.',
            ]);
        }

        OpenPlaySessionLog::record($request, $session, 'open_play.board_opened', 'Took the board');

        return back()
            ->with('success', "You are running {$session->name}.")
            ->with('boardUrl', route('open-play.board.public', ['code' => $session->session_code]));
    }
}
