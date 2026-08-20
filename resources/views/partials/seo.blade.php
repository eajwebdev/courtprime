@php($seo = \App\Support\Seo::resolve(request(), $page ?? []))

{{--
    Printed by the server, not by Inertia.

    Inertia's <Head> only runs in the browser, so a crawler that does not
    execute JavaScript would otherwise receive a document with no title and no
    description at all. These tags are in the first response instead. The
    `inertia` attribute on the title lets client-side navigation keep updating
    it; the rest is per-request and correct as printed.
--}}
<title inertia>{{ $seo['title'] }}</title>
<meta name="description" content="{{ $seo['description'] }}">
<link rel="canonical" href="{{ $seo['canonical'] }}">

@if ($seo['index'])
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
@else
    <meta name="robots" content="noindex, nofollow">
@endif

<meta property="og:type" content="website">
<meta property="og:site_name" content="{{ \App\Support\Seo::SITE_NAME }}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="{{ $seo['title'] }}">
<meta property="og:description" content="{{ $seo['description'] }}">
<meta property="og:url" content="{{ $seo['canonical'] }}">
<meta property="og:image" content="{{ $seo['image'] }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="CourtPrime — one player identity, every connected court">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $seo['title'] }}">
<meta name="twitter:description" content="{{ $seo['description'] }}">
<meta name="twitter:image" content="{{ $seo['image'] }}">

@foreach ($seo['schema'] as $schema)
    <script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
@endforeach
