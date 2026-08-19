<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * QRPh subscription payments. Without these the billing page still shows
     * what is owed, it just cannot raise a QR to pay it.
     */
    'paymongo' => [
        'secret' => env('PAYMONGO_SECRET_KEY'),
        'public' => env('PAYMONGO_PUBLIC_KEY'),
        'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
    ],

    /*
     * Subscription billing behaviour. cycle_months is the term a new
     * subscription defaults to before the club picks one; notify_days is how
     * long before an invoice falls due the reminder goes out; lock_grace_days
     * is how long a club keeps working after that; min_amount is the smallest
     * bill worth raising a QR for, PayMongo rejects sources under its own
     * floor and this catches a bad plan price before the API call does.
     */
    'billing' => [
        'cycle_months' => (int) env('BILLING_CYCLE_MONTHS', 1),
        'notify_days' => (int) env('BILLING_NOTIFY_DAYS', 3),
        'lock_grace_days' => (int) env('BILLING_LOCK_GRACE_DAYS', 2),
        'min_amount' => (float) env('BILLING_MIN_AMOUNT', 20),
    ],

];
