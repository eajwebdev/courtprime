<?php

use App\Http\Controllers\Api\CourtPrimeApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('courtprime/v1')->group(function () {
    Route::get('courts', [CourtPrimeApiController::class, 'courts'])->middleware('courtprime.api:courts:read');
    Route::get('reservations', [CourtPrimeApiController::class, 'reservations'])->middleware('courtprime.api:reservations:read');
    Route::get('scores', [CourtPrimeApiController::class, 'scores'])->middleware('courtprime.api:scores:read');
    Route::get('tournaments', [CourtPrimeApiController::class, 'tournaments'])->middleware('courtprime.api:tournaments:read');
    Route::get('players', [CourtPrimeApiController::class, 'players'])->middleware('courtprime.api:players:read');
    Route::get('rankings', [CourtPrimeApiController::class, 'rankings'])->middleware('courtprime.api:rankings:read');
});
