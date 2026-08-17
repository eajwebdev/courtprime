<?php

namespace App\Services;

use App\Models\ActivityTimelineEvent;
use Illuminate\Database\Eloquent\Model;

class ActivityTimelineService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function record(Model $subject, string $eventType, string $title, array $data = []): ActivityTimelineEvent
    {
        $related = $data['related'] ?? null;

        return ActivityTimelineEvent::query()->create([
            'organization_id' => $data['organization_id'] ?? $subject->organization_id ?? null,
            'branch_id' => $data['branch_id'] ?? $subject->branch_id ?? null,
            'actor_id' => $data['actor_id'] ?? auth()->id(),
            'subject_type' => $subject::class,
            'subject_id' => $subject->getKey(),
            'related_type' => $related instanceof Model ? $related::class : null,
            'related_id' => $related instanceof Model ? $related->getKey() : null,
            'event_type' => $eventType,
            'title' => $title,
            'description' => $data['description'] ?? null,
            'visibility' => $data['visibility'] ?? 'team',
            'metadata' => $data['metadata'] ?? null,
            'occurred_at' => $data['occurred_at'] ?? now(),
        ]);
    }
}
