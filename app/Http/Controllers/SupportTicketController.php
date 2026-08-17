<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupportTicketMessageStoreRequest;
use App\Http\Requests\SupportTicketStoreRequest;
use App\Models\CourtPrimeNotification;
use App\Models\SupportTicket;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $user = request()->user();
        $baseQuery = $this->visibleTickets($tenantContext);

        $tickets = (clone $baseQuery)
            ->with([
                'organization:id,name',
                'creator:id,name,email',
                'assignee:id,name,email',
                'messages' => fn ($query) => $query
                    ->when(! $user->is_superadmin, fn ($query) => $query->where('internal', false))
                    ->latest(),
            ])
            ->latest()
            ->paginate(15);

        return Inertia::render('support-tickets', [
            'tickets' => $tickets,
            'metrics' => [
                'open' => (clone $baseQuery)->where('status', 'open')->count(),
                'urgent' => (clone $baseQuery)->where('priority', 'urgent')->count(),
                'resolved' => (clone $baseQuery)->where('status', 'resolved')->count(),
            ],
            'canUseInternalNotes' => $user->is_superadmin,
        ]);
    }

    public function store(SupportTicketStoreRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($validated, $tenantContext, $user) {
            $ticket = SupportTicket::query()->create([
                'organization_id' => $tenantContext->currentOrganizationId(),
                'created_by' => $user->id,
                'ticket_number' => $this->ticketNumber(),
                'subject' => $validated['subject'],
                'category' => $validated['category'],
                'priority' => $validated['priority'],
                'status' => 'open',
                'source' => 'app',
            ]);

            $ticket->messages()->create([
                'user_id' => $user->id,
                'author_name' => $user->name,
                'author_email' => $user->email,
                'body' => $validated['body'],
                'internal' => false,
            ]);

            CourtPrimeNotification::query()->create([
                'organization_id' => $ticket->organization_id,
                'user_id' => $user->id,
                'category' => 'support',
                'title' => 'Support ticket created',
                'body' => $ticket->ticket_number.' is now open.',
                'data' => ['url' => '/support-tickets', 'ticket_id' => $ticket->id],
            ]);
        });

        return back()->with('success', 'CourtPrime support ticket created.');
    }

    public function message(SupportTicketMessageStoreRequest $request, SupportTicket $supportTicket, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorizeTicket($supportTicket, $tenantContext);

        $validated = $request->validated();
        $user = $request->user();
        $internal = (bool) $validated['internal'];

        if ($internal && ! $user->is_superadmin) {
            abort(403);
        }

        $supportTicket->messages()->create([
            'user_id' => $user->id,
            'author_name' => $user->name,
            'author_email' => $user->email,
            'body' => $validated['body'],
            'internal' => $internal,
        ]);

        $supportTicket->update([
            'status' => $validated['status'],
            'resolved_at' => $validated['status'] === 'resolved' ? now() : $supportTicket->resolved_at,
        ]);

        if ((int) $supportTicket->created_by !== (int) $user->id) {
            CourtPrimeNotification::query()->create([
                'organization_id' => $supportTicket->organization_id,
                'user_id' => $supportTicket->created_by,
                'category' => 'support',
                'title' => 'Support ticket updated',
                'body' => $supportTicket->ticket_number.' has a new reply.',
                'data' => ['url' => '/support-tickets', 'ticket_id' => $supportTicket->id],
            ]);
        }

        return back()->with('success', 'CourtPrime support ticket updated.');
    }

    private function authorizeTicket(SupportTicket $ticket, TenantContext $tenantContext): void
    {
        $user = request()->user();

        if ($user->is_superadmin || (int) $ticket->created_by === (int) $user->id) {
            return;
        }

        abort_unless($ticket->organization_id && (int) $ticket->organization_id === (int) $tenantContext->currentOrganizationId(), 403);
    }

    private function visibleTickets(TenantContext $tenantContext): Builder
    {
        $user = request()->user();
        $organizationId = $tenantContext->currentOrganizationId();

        return SupportTicket::query()
            ->when(! $user->is_superadmin, function (Builder $query) use ($organizationId, $user) {
                $query->where(function (Builder $query) use ($organizationId, $user) {
                    if ($organizationId) {
                        $query->where('organization_id', $organizationId)->orWhere('created_by', $user->id);

                        return;
                    }

                    $query->where('created_by', $user->id);
                });
            });
    }

    private function ticketNumber(): string
    {
        return 'CP-SUP-'.now()->format('Ymd').'-'.str_pad((string) (SupportTicket::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }
}
