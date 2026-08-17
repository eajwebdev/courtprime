@include('errors.courtprime', [
    'statusCode' => '429',
    'title' => 'Too many requests',
    'message' => 'CourtPrime is slowing this action down for security. Please wait a moment and try again.',
    'actionHref' => url()->previous(),
    'actionLabel' => 'Go Back',
])
