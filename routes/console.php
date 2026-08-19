<?php

use App\Jobs\LapseOverdueSubscriptions;
use App\Jobs\RenewDueSubscriptions;
use App\Jobs\SendReservationReminders;
use App\Jobs\SendSubscriptionBillingReminders;
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

Artisan::command('courtprime:renew-subscriptions', function () {
    RenewDueSubscriptions::dispatch();
    $this->info('CourtPrime subscription renewal job dispatched.');
})->purpose('Roll subscriptions whose period has ended into their next one and raise the invoice');

Artisan::command('courtprime:subscription-reminders', function () {
    SendSubscriptionBillingReminders::dispatch();
    $this->info('CourtPrime subscription reminder job dispatched.');
})->purpose('Notify clubs whose subscription invoice is due soon');

Artisan::command('courtprime:lapse-subscriptions', function () {
    LapseOverdueSubscriptions::dispatch();
    $this->info('CourtPrime subscription lapse job dispatched.');
})->purpose('Lapse subscriptions whose grace days have run out');

/* Renew before reminding, so a club whose period ended today is reminded
   about the invoice that renewal just raised rather than a day behind it. */
Schedule::command('courtprime:renew-subscriptions')->dailyAt('00:05');
Schedule::command('courtprime:subscription-reminders')->dailyAt('07:00');
Schedule::command('courtprime:lapse-subscriptions')->everySixHours();
