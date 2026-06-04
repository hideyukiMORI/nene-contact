<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

interface AttachmentRepositoryInterface
{
    /** Inserts an attachment using its own organization_id (public upload); returns the id. */
    public function create(Attachment $attachment): int;

    /** A pending (unlinked, not deleted) attachment for the given form — for linking on submit. */
    public function findPendingForLink(int $id, int $organizationId, int $contactFormId): ?Attachment;

    public function linkToSubmission(int $id, int $organizationId, int $submissionId): void;

    /**
     * Organization-scoped (admin): attachments of a submission.
     *
     * @return list<Attachment>
     */
    public function listBySubmission(int $submissionId): array;

    /** Organization-scoped (admin): one attachment of a submission, or null. */
    public function findForDownload(int $id, int $submissionId): ?Attachment;
}
