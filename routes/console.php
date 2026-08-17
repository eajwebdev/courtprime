<?php

use App\Jobs\SendReservationReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('courtprime:reservation-reminders', function () {
    SendReservationReminders::dispatch();
    $this->info('CourtPrime reservation reminder job dispatched.');
})->purpose('Dispatch upcoming CourtPrime reservation reminders');

Schedule::command('courtprime:reservation-reminders')->everyFifteenMinutes();
