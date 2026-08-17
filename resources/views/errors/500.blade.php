@include('errors.courtprime', [
    'statusCode' => '500',
    'title' => 'Server issue',
    'message' => 'CourtPrime hit an unexpected issue while handling this request.',
    'actionHref' => url('/dashboard'),
    'actionLabel' => 'Back to Dashboard',
])
