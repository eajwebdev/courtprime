<?php

namespace App\Http\Controllers;

use App\Services\PlayerRankingService;
use Inertia\Inertia;
use Inertia\Response;

class PublicRankingController extends Controller
{
    public function __invoke(PlayerRankingService $rankings): Response
    {
        return Inertia::render('public-rankings', [
            'rankings' => $rankings->globalRankings(50),
        ]);
    }
}
