@include('errors.courtprime', [
    'statusCode' => '422',
    'title' => 'Request needs review',
    'message' => 'CourtPrime could not process the submitted details. Check the form and try again.',
    'actionHref' => url()->previous(),
    'actionLabel' => 'Go Back',
])
