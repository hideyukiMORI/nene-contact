<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

/**
 * Attachment metadata persistence. Public upload/link use the explicit organization_id
 * resolved from the public form key; admin reads are organization-scoped via the holder
 * (ADR 0006). Soft-deleted/purged attachments are excluded from admin reads.
 */
final readonly class PdoAttachmentRepository implements AttachmentRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, contact_form_id, submission_id, field_name, original_filename, content_type, size_bytes, storage_key, scan_status, created_at';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function create(Attachment $attachment): int
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'INSERT INTO submission_attachments
             (organization_id, contact_form_id, submission_id, field_name, original_filename, content_type, size_bytes, storage_key, scan_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $attachment->organizationId,
                $attachment->contactFormId,
                $attachment->submissionId,
                $attachment->fieldName,
                $attachment->originalFilename,
                $attachment->contentType,
                $attachment->sizeBytes,
                $attachment->storageKey,
                $attachment->scanStatus,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    public function findPendingForLink(int $id, int $organizationId, int $contactFormId): ?Attachment
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM submission_attachments
             WHERE id = ? AND organization_id = ? AND contact_form_id = ? AND submission_id IS NULL AND deleted_at IS NULL',
            [$id, $organizationId, $contactFormId],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    public function linkToSubmission(int $id, int $organizationId, int $submissionId): void
    {
        $this->query->execute(
            'UPDATE submission_attachments SET submission_id = ?, updated_at = ?
             WHERE id = ? AND organization_id = ? AND submission_id IS NULL AND deleted_at IS NULL',
            [$submissionId, date('Y-m-d H:i:s'), $id, $organizationId],
        );
    }

    /** @return list<Attachment> */
    public function listBySubmission(int $submissionId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM submission_attachments
             WHERE submission_id = ? AND organization_id = ? AND deleted_at IS NULL AND purged_at IS NULL
             ORDER BY id ASC',
            [$submissionId, $this->orgId->get()],
        );

        return array_map(fn (array $row): Attachment => $this->mapRow($row), $rows);
    }

    public function findForDownload(int $id, int $submissionId): ?Attachment
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM submission_attachments
             WHERE id = ? AND submission_id = ? AND organization_id = ? AND deleted_at IS NULL AND purged_at IS NULL',
            [$id, $submissionId, $this->orgId->get()],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): Attachment
    {
        return new Attachment(
            organizationId: (int) $row['organization_id'],
            contactFormId: (int) $row['contact_form_id'],
            fieldName: (string) $row['field_name'],
            originalFilename: (string) $row['original_filename'],
            contentType: (string) $row['content_type'],
            sizeBytes: (int) $row['size_bytes'],
            storageKey: isset($row['storage_key']) ? (string) $row['storage_key'] : null,
            submissionId: isset($row['submission_id']) ? (int) $row['submission_id'] : null,
            scanStatus: (string) $row['scan_status'],
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
        );
    }
}
