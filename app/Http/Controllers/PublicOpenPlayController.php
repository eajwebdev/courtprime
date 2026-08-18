<?php

namespace App\Http\Controllers;

use App\Models\OpenPlaySession;
use App\Support\NetworkClock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicOpenPlayController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /* Club-local today, not UTC today. See NetworkClock. */
        $date = $request->query('date', NetworkClock::today());
        $search = trim((string) $request->query('search', ''));

        $sessions = OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->with(['branch.organization'])
            ->withCount(['players', 'queue', 'sessionCourts'])
            ->whereDate('session_date', '>=', $date)
            ->whereIn('status', ['scheduled', 'open', 'live'])
            ->whereHas('branch.organization', fn ($query) => $query->whereIn('status', ['trial', 'active']))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhereHas('branch', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('branch.organization', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->paginate(20)
            ->through(fn (OpenPlaySession $session) => [
                'id' => $session->id,
                'name' => $session->name,
                /*
                  * Deliberately no session_code or session_key. Listing them
                  * publicly would make the credentials pointless — anyone could
                  * read a session's pair off the discovery page and walk into
                  * it. The listing says a session exists; the club decides who
                  * gets in.
                  */
                'courts_count' => $session->session_courts_count,
                'session_date' => $session->session_date?->toDateString(),
                'start_time' => substr((string) $session->start_time, 0, 5),
                'end_time' => substr((string) $session->end_time, 0, 5),
                'max_players' => $session->max_players,
                'players_count' => $session->players_count,
                'queue_count' => $session->queue_count,
                'min_rating' => $session->min_rating,
                'max_rating' => $session->max_rating,
                'entry_fee' => $session->entry_fee,
                'status' => $session->status,
                'branch' => [
                    'name' => $session->branch?->name,
                    'organization' => $session->branch?->organization?->name,
                    'organization_slug' => $session->branch?->organization?->slug,
                ],
            ]);

        return Inertia::render('open-play-discovery', [
            'date' => $date,
            'search' => $search,
            'sessions' => $sessions,
        ]);
    }
}
