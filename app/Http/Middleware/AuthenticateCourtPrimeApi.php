<?php

namespace App\Http\Middleware;

use App\Models\ApiCredential;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateCourtPrimeApi
{
    public function handle(Request $request, Closure $next, ?string $ability = null): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'CourtPrime API token required.'], 401);
        }

        $credential = ApiCredential::query()
            ->where('token_hash', hash('sha256', $token))
            ->where('status', 'active')
            ->first();

        if (! $credential || ($credential->expires_at && $credential->expires_at->isPast())) {
            return response()->json(['message' => 'Invalid or expired CourtPrime API token.'], 401);
        }

        if ($ability && ! in_array($ability, $credential->abilities ?? [], true)) {
            return response()->json(['message' => 'CourtPrime API token is missing the required ability.'], 403);
        }

        $credential->forceFill(['last_used_at' => now()])->save();
        $request->attributes->set('courtprime_api_credential', $credential);
        $request->attributes->set('courtprime_organization_id', $credential->organization_id);

        return $next($request);
    }
}
