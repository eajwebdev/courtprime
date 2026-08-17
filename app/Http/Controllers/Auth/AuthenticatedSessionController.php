<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\LoginAudit;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        LoginAudit::query()->create([
            'user_id' => $request->user()->id,
            'email' => $request->string('email')->toString(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'succeeded' => true,
            'occurred_at' => now(),
        ]);

        return redirect()->intended($this->homeFor(app(TenantContext::class)));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function homeFor(TenantContext $tenantContext): string
    {
        $role = $tenantContext->activeRole()?->value;

        return match ($role) {
            'cashier' => route('pos.index', absolute: false),
            'front_desk', 'branch_manager' => route('operations', absolute: false),
            'scorekeeper' => route('live-courts.index', absolute: false),
            'tournament_director' => route('tournaments.index', absolute: false),
            'player' => route('me', absolute: false),
            default => route('dashboard', absolute: false),
        };
    }
}
