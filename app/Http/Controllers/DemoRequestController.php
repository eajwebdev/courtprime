<?php

namespace App\Http\Controllers;

use App\Http\Requests\DemoRequestStoreRequest;
use App\Models\DemoRequest;
use App\Services\DemoReferenceService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DemoRequestController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('request-demo');
    }

    public function store(DemoRequestStoreRequest $request, DemoReferenceService $references): RedirectResponse
    {
        $demoRequest = DemoRequest::query()->create([
            ...$request->validated(),
            'reference' => $references->next(),
            'status' => 'new',
        ]);

        return to_route('demo.requested', $demoRequest);
    }

    public function confirmation(DemoRequest $demoRequest): Response
    {
        return Inertia::render('demo-confirmation', [
            'demoRequest' => $demoRequest,
        ]);
    }
}
