@include('errors.courtprime', [
    'statusCode' => '403',
    'title' => 'Access denied',
    'message' => 'This CourtPrime workspace or record is not available to your current role.',
    'actionHref' => url('/dashboard'),
    'actionLabel' => 'Back to Dashboard',
])
