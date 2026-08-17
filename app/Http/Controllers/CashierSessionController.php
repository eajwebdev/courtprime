<?php

namespace App\Http\Controllers;

use App\Http\Requests\CashierSessionCloseRequest;
use App\Http\Requests\CashierSessionOpenRequest;
use App\Models\Branch;
use App\Models\CashierSession;
use App\Services\CashierSessionService;
use Inertia\Inertia;
use Inertia\Response;

class CashierSessionController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', CashierSession::class);

        return Inertia::render('cashier-sessions', [
            'branches' => Branch::query()->orderBy('name')->get(),
            'sessions' => CashierSession::query()->with(['branch', 'user'])->latest()->paginate(15),
        ]);
    }

    public function store(CashierSessionOpenRequest $request, CashierSessionService $cashiers)
    {
        $this->authorize('create', CashierSession::class);

        $branch = Branch::query()->findOrFail($request->integer('branch_id'));
        $cashiers->open($request->user(), $branch, (float) $request->input('opening_cash'));

        return back()->with('success', 'Cashier session opened.');
    }

    public function close(CashierSessionCloseRequest $request, CashierSession $cashierSession, CashierSessionService $cashiers)
    {
        $this->authorize('update', $cashierSession);

        $cashiers->close($cashierSession, (float) $request->input('closing_cash'));

        return back()->with('success', 'Cashier session closed.');
    }
}
