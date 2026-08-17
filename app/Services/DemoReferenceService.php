<?php

namespace App\Services;

use App\Models\DemoRequest;

class DemoReferenceService
{
    public function next(): string
    {
        $year = now()->year;
        $latestId = DemoRequest::query()->max('id') ?? 0;

        return sprintf('DEMO-%s-%06d', $year, $latestId + 1);
    }
}
