@include('errors.courtprime', [
    'statusCode' => '404',
    'title' => 'Page not found',
    'message' => 'The CourtPrime page or record you requested could not be found.',
    'actionHref' => url('/'),
    'actionLabel' => 'Back to CourtPrime',
])
