<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @include('partials.seo')

        <meta name="theme-color" content="#e61b5b">
        <meta name="application-name" content="EAJ CourtPrime">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="CourtPrime">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <link rel="icon" type="image/png" href="{{ asset('cp.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('cp.png') }}">
        <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
        <link rel="preload" as="image" href="{{ asset('cp3.png') }}">
        <link rel="preload" as="image" href="{{ asset('cp-model5.png') }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
        <noscript>
            <div style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Instrument Sans,system-ui,sans-serif;">
                <div style="max-width:420px;text-align:center;">
                    <img src="{{ asset('cp.png') }}" alt="CourtPrime" style="width:72px;height:72px;object-fit:contain;margin:0 auto 16px;">
                    <h1 style="font-size:24px;margin:0 0 8px;">CourtPrime needs JavaScript</h1>
                    <p style="margin:0;color:#64748b;">Enable JavaScript to use the CourtPrime workspace.</p>
                </div>
            </div>
        </noscript>
    </body>
</html>
