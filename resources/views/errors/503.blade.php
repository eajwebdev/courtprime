@include('errors.courtprime', [
    'statusCode' => '503',
    'title' => 'CourtPrime is temporarily unavailable',
    'message' => 'Maintenance or deployment work is in progress. Please try again shortly.',
    'actionHref' => url('/'),
    'actionLabel' => 'Back to CourtPrime',
])
