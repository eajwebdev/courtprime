@php
    $statusCode = $statusCode ?? 'Error';
    $title = $title ?? 'Something needs attention';
    $message = $message ?? 'CourtPrime could not complete this request.';
    $actionHref = $actionHref ?? url('/');
    $actionLabel = $actionLabel ?? 'Back to CourtPrime';
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#e61b5b">
        <title>{{ $statusCode }} - {{ config('app.name', 'EAJ CourtPrime') }}</title>
        <link rel="icon" type="image/png" href="{{ asset('cp.png') }}">
        <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
        <style>
            :root { color-scheme: light; }
            body { margin: 0; min-height: 100vh; font-family: "Instrument Sans", system-ui, sans-serif; color: #111827; background: #f8fafc; }
            main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
            section { width: min(100%, 560px); border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff; padding: 32px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08); }
            img { width: 64px; height: 64px; object-fit: contain; }
            p.code { margin: 24px 0 0; color: #e61b5b; font-size: 14px; font-weight: 700; letter-spacing: 0; }
            h1 { margin: 8px 0 0; font-size: clamp(28px, 5vw, 44px); line-height: 1.05; letter-spacing: 0; }
            p.message { margin: 16px 0 0; color: #64748b; font-size: 16px; line-height: 1.6; }
            a { margin-top: 24px; display: inline-flex; min-height: 40px; align-items: center; border-radius: 6px; background: #111827; color: #ffffff; padding: 0 16px; font-size: 14px; font-weight: 600; text-decoration: none; }
            a:focus-visible { outline: 3px solid #e61b5b; outline-offset: 3px; }
        </style>
    </head>
    <body>
        <main>
            <section aria-labelledby="error-title">
                <img src="{{ asset('cp.png') }}" alt="CourtPrime">
                <p class="code">{{ $statusCode }}</p>
                <h1 id="error-title">{{ $title }}</h1>
                <p class="message">{{ $message }}</p>
                <a href="{{ $actionHref }}">{{ $actionLabel }}</a>
            </section>
        </main>
    </body>
</html>
