<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class SubmissionNoteResponse
{
    /** @return array<string, mixed> */
    public static function toArray(SubmissionNote $note): array
    {
        return [
            'id' => $note->id,
            'submission_id' => $note->submissionId,
            'author_user_id' => $note->authorUserId,
            'body' => $note->body,
            'created_at' => $note->createdAt,
        ];
    }
}
