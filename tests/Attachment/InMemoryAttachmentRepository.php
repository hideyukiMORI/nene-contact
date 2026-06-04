<?php

declare(strict_types=1);

namespace NeneContact\Tests\Attachment;

use NeneContact\Attachment\Attachment;
use NeneContact\Attachment\AttachmentRepositoryInterface;

final class InMemoryAttachmentRepository implements AttachmentRepositoryInterface
{
    /** @var list<Attachment> */
    public array $created = [];

    /** @var list<array{id: int, submission_id: int}> */
    public array $linked = [];

    public function create(Attachment $attachment): int
    {
        $this->created[] = $attachment;

        return 42;
    }

    public function findPendingForLink(int $id, int $organizationId, int $contactFormId): ?Attachment
    {
        return null;
    }

    public function linkToSubmission(int $id, int $organizationId, int $submissionId): void
    {
        $this->linked[] = ['id' => $id, 'submission_id' => $submissionId];
    }

    /** @return list<Attachment> */
    public function listBySubmission(int $submissionId): array
    {
        return [];
    }

    public function findForDownload(int $id, int $submissionId): ?Attachment
    {
        return null;
    }
}
