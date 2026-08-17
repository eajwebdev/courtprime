<?php

use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\AuthenticateCourtPrimeApi;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RecordPlatformAudit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        channels: __DIR__.'/../routes/channels.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            RecordPlatformAudit::class,
            AddSecurityHeaders::class,
        ]);

        $middleware->api(append: [
            AddSecurityHeaders::class,
        ]);

        $middleware->alias([
            'courtprime.api' => AuthenticateCourtPrimeApi::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
