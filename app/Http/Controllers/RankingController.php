<?php

namespace App\Http\Controllers;

use App\Models\PlayerRanking;
use App\Services\PlayerRankingService;
use App\Services\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class RankingController extends Controller
{
    public function index(PlayerRankingService $rankings, TenantContext $tenantContext): Response
    {
        $organizationId = $tenantContext->currentOrganizationId();

        if ($organizationId) {
            $rankings->refresh($organizationId);
        }

        return Inertia::render('rankings', [
            'globalRankings' => $rankings->globalRankings(),
            'clubRankings' => PlayerRanking::query()
                ->with('player')
                ->where('division', 'club')
                ->orderBy('rank')
                ->get(),
        ]);
    }
}
