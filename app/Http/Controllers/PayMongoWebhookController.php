<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionInvoice;
use App\Services\Payments\PayMongoQrPh;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * PayMongo telling us a QRPh payment cleared.
 *
 * This is the only place a subscription invoice is marked paid from a QR, and
 * it verifies the signature first: without that check anyone who found the URL
 * could post a paid event and award themselves a year.
 *
 * Answers 200 to anything it recognises but cannot act on, because a webhook
 * that returns an error gets retried forever for a payment that was never ours.
 */
class PayMongoWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        PayMongoQrPh $gateway,
        SubscriptionBillingService $billing,
    ): Response {
        $payload = $request->getContent();

        if (! $gateway->verifyWebhook($payload, $request->header('Paymongo-Signature'))) {
            return response('Invalid signature', 401);
        }

        $event = $request->json('data.attributes.type');
        $resource = $request->json('data.attributes.data');

        if (! in_array($event, ['source.chargeable', 'payment.paid'], true)) {
            return response('Ignored', 200);
        }

        $reference = $resource['id'] ?? null;

        if (! $reference) {
            return response('No reference', 200);
        }

        $invoice = SubscriptionInvoice::query()
            ->where('payment_reference', $reference)
            ->whereIn('status', ['issued', 'overdue', 'partial'])
            ->first();

        if (! $invoice) {
            /* Already settled, or not a bill of ours. Either way there is
               nothing to do and nothing to retry. */
            return response('No matching invoice', 200);
        }

        $billing->settle($invoice, 'qrph', $reference);

        return response('OK', 200);
    }
}
