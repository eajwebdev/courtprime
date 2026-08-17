@include('errors.courtprime', [
    'statusCode' => '419',
    'title' => 'Session expired',
    'message' => 'Your secure CourtPrime session expired. Sign in again or refresh before submitting the form.',
    'actionHref' => url('/login'),
    'actionLabel' => 'Sign In Again',
])
