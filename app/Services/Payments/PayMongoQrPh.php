<?php

namespace App\Services\Payments;

use App\Models\SubscriptionInvoice;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * QRPh subscription payments through PayMongo.
 *
 * PayMongo takes amounts in centavos and settles QRPh asynchronously: the club
 * scans, pays in its own banking app, and PayMongo tells us afterwards. So this
 * creates the source and hands back the QR, and the invoice is only marked paid
 * when the webhook confirms it. Marking it paid at scan time would credit money
 * that has not arrived.
 *
 * Nothing here invents a fallback when the keys are missing. A billing
 * integration that quietly does nothing is worse than one that refuses: the
 * club would see a QR that settles nothing.
 */
class PayMongoQrPh
{
    private const BASE = 'https://api.paymongo.com/v1';

    public function configured(): bool
    {
        return filled(config('services.paymongo.secret'));
    }

    /**
     * Create a QRPh source for an invoice.
     *
     * @return array{reference:string, qr_image:?string, redirect:?string, status:string}
     */
    public function createPayment(SubscriptionInvoice $invoice): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('PayMongo is not configured. Set PAYMONGO_SECRET_KEY before taking subscription payments.');
        }

        $response = Http::withBasicAuth((string) config('services.paymongo.secret'), '')
            ->acceptJson()
            ->post(self::BASE.'/sources', [
                'data' => [
                    'attributes' => [
                        /* Centavos, integer. A float here is how a bill for
                           1,000.00 becomes 999.99. */
                        'amount' => (int) round(((float) $invoice->total_amount) * 100),
                        'currency' => 'PHP',
                        'type' => 'qrph',
                        'redirect' => [
                            'success' => route('billing.return', ['invoice' => $invoice->id, 'result' => 'paid']),
                            'failed' => route('billing.return', ['invoice' => $invoice->id, 'result' => 'failed']),
                        ],
                        'metadata' => [
                            'invoice_number' => $invoice->invoice_number,
                            'organization_id' => (string) $invoice->organization_id,
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('PayMongo refused the payment: '.$response->body());
        }

        $data = $response->json('data');

        return [
            'reference' => (string) ($data['id'] ?? ''),
            'qr_image' => $data['attributes']['qr_image'] ?? $data['attributes']['redirect']['checkout_url'] ?? null,
            'redirect' => $data['attributes']['redirect']['checkout_url'] ?? null,
            'status' => (string) ($data['attributes']['status'] ?? 'pending'),
        ];
    }

    /**
     * Whether a webhook really came from PayMongo.
     *
     * The signature header carries a timestamp and a digest over
     * "timestamp.payload"; comparing with hash_equals keeps the check constant
     * time. Without this anyone could post a paid event and get a free year.
     */
    public function verifyWebhook(string $payload, ?string $signatureHeader): bool
    {
        $secret = (string) config('services.paymongo.webhook_secret');

        if ($secret === '' || ! $signatureHeader) {
            return false;
        }

        $parts = [];

        foreach (explode(',', $signatureHeader) as $piece) {
            [$key, $value] = array_pad(explode('=', trim($piece), 2), 2, null);
            $parts[$key] = $value;
        }

        $timestamp = $parts['t'] ?? null;
        $signature = $parts['te'] ?? $parts['li'] ?? null;

        if (! $timestamp || ! $signature) {
            return false;
        }

        return hash_equals(hash_hmac('sha256', $timestamp.'.'.$payload, $secret), $signature);
    }
}
