<?php

namespace App\Http\Controllers;

use App\Models\PlatformAuditLog;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAuditController extends Controller
{
    public function __invoke(): Response
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        return Inertia::render('platform-audit', [
            'logs' => PlatformAuditLog::query()
                ->with(['user:id,name,email', 'organization:id,name'])
                ->latest('occurred_at')
                ->paginate(50),
        ]);
    }
}
