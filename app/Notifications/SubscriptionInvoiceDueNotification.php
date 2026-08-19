<?php

namespace App\Notifications;

use App\Models\SubscriptionInvoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionInvoiceDueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly SubscriptionInvoice $invoice) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $due = $this->invoice->due_on?->toFormattedDateString() ?? 'soon';
        $amount = number_format((float) $this->invoice->total_amount, 2);

        return (new MailMessage)
            ->subject('CourtPrime subscription due '.$due)
            ->greeting('Your subscription renews soon')
            ->line('Invoice '.$this->invoice->invoice_number.' for ₱'.$amount.' is due on '.$due.'.')
            ->line('Courts keep running past the due date, there are a couple of grace days to pay.')
            ->action('Open billing', url('/billing'))
            ->line('Pay by QRPh from that page and this clears automatically.');
    }
}
