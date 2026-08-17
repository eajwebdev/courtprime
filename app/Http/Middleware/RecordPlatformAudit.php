<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use App\Models\PlatformAuditLog;
use App\Services\TenantContext;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RecordPlatformAudit
{
    public function handle(Request $request, Closure $next): Response
    {
        $routeModel = $this->routeModel($request);
        $oldValues = $request->isMethod('GET') ? null : $this->safeValues($routeModel?->getAttributes());
        $response = $next($request);
        $user = $request->user();

        if (! $user || ! $this->shouldRecord($request)) {
            return $response;
        }

        $newValues = null;

        if ($routeModel && ! $request->isMethod('GET')) {
            $newValues = $routeModel->exists ? $this->safeValues($routeModel->fresh()?->getAttributes() ?? $routeModel->getAttributes()) : null;
        }

        PlatformAuditLog::query()->create([
            'user_id' => $user->id,
            'organization_id' => $this->organizationId($request),
            'auditable_type' => $routeModel ? $routeModel::class : null,
            'auditable_id' => $routeModel?->getKey(),
            'action' => $this->action($request),
            'route_name' => $request->route()?->getName(),
            'method' => $request->method(),
            'path' => $request->path(),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 2000),
            'metadata' => [
                'status_code' => $response->getStatusCode(),
                'route_parameters' => collect($request->route()?->parameters() ?? [])
                    ->map(fn ($value) => $value instanceof Model ? $value->getKey() : $value)
                    ->all(),
            ],
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'occurred_at' => now(),
        ]);

        return $response;
    }

    private function shouldRecord(Request $request): bool
    {
        if (! $request->route()) {
            return false;
        }

        if (! $request->isMethod('GET')) {
            return true;
        }

        return str($request->route()?->getName() ?? '')->is([
            'tenant-subscriptions.*',
            'subscription-plans.*',
            'demo-pipeline.*',
            'duplicate-identities.*',
            'reports.*',
            'payments.*',
            'expenses.*',
            'staff.*',
            'maintenance.*',
            'platform-audit.*',
        ]);
    }

    private function organizationId(Request $request): ?int
    {
        $routeOrganization = $request->route('organization');

        if ($routeOrganization instanceof Organization) {
            return $routeOrganization->id;
        }

        if (is_numeric($routeOrganization)) {
            return (int) $routeOrganization;
        }

        return app(TenantContext::class)->currentOrganizationId();
    }

    private function routeModel(Request $request): ?Model
    {
        return collect($request->route()?->parameters() ?? [])
            ->first(fn ($value) => $value instanceof Model);
    }

    /**
     * @param  array<string, mixed>|null  $values
     * @return array<string, mixed>|null
     */
    private function safeValues(?array $values): ?array
    {
        if (! $values) {
            return null;
        }

        return array_diff_key($values, array_flip([
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
        ]));
    }

    private function action(Request $request): string
    {
        return ($request->isMethod('GET') ? 'view' : 'mutate').'.'.($request->route()?->getName() ?? $request->path());
    }
}
