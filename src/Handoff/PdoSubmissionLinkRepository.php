<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

/**
 * Submission-link persistence, organization-scoped via the resolved holder (ADR 0006).
 * {@see save()} upserts by (submission_id, target) — INSERT or UPDATE only, never DELETE
 * (ADR 0016); a failed handoff is preserved as a `failed` row for retry.
 */
final readonly class PdoSubmissionLinkRepository implements SubmissionLinkRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, submission_id, attachment_id, target, deal_opportunity_id, vault_document_id, invoice_client_id, handoff_status, last_error, created_at, updated_at';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function findBySubmissionAndTarget(int $submissionId, string $target): ?SubmissionLink
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM submission_links WHERE submission_id = ? AND target = ? AND attachment_id IS NULL AND organization_id = ?',
            [$submissionId, $target, $this->orgId->get()],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    public function findBySubmissionTargetAttachment(int $submissionId, string $target, ?int $attachmentId): ?SubmissionLink
    {
        if ($attachmentId === null) {
            return $this->findBySubmissionAndTarget($submissionId, $target);
        }

        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM submission_links WHERE submission_id = ? AND target = ? AND attachment_id = ? AND organization_id = ?',
            [$submissionId, $target, $attachmentId, $this->orgId->get()],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    /** @return list<SubmissionLink> */
    public function findBySubmission(int $submissionId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM submission_links WHERE submission_id = ? AND organization_id = ? ORDER BY id ASC',
            [$submissionId, $this->orgId->get()],
        );

        return array_map(fn (array $row): SubmissionLink => $this->mapRow($row), $rows);
    }

    public function save(SubmissionLink $link): int
    {
        $now = date('Y-m-d H:i:s');
        $existing = $this->findBySubmissionTargetAttachment($link->submissionId, $link->target, $link->attachmentId);

        if ($existing !== null) {
            $this->query->execute(
                'UPDATE submission_links
                 SET deal_opportunity_id = ?, vault_document_id = ?, invoice_client_id = ?, handoff_status = ?, last_error = ?, updated_at = ?
                 WHERE id = ? AND organization_id = ?',
                [
                    $link->dealOpportunityId,
                    $link->vaultDocumentId,
                    $link->invoiceClientId,
                    $link->handoffStatus,
                    $link->lastError,
                    $now,
                    $existing->id,
                    $this->orgId->get(),
                ],
            );

            return (int) $existing->id;
        }

        $this->query->execute(
            'INSERT INTO submission_links (organization_id, submission_id, attachment_id, target, deal_opportunity_id, vault_document_id, invoice_client_id, handoff_status, last_error, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $link->organizationId,
                $link->submissionId,
                $link->attachmentId,
                $link->target,
                $link->dealOpportunityId,
                $link->vaultDocumentId,
                $link->invoiceClientId,
                $link->handoffStatus,
                $link->lastError,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): SubmissionLink
    {
        return new SubmissionLink(
            organizationId: (int) $row['organization_id'],
            submissionId: (int) $row['submission_id'],
            target: (string) $row['target'],
            handoffStatus: (string) $row['handoff_status'],
            dealOpportunityId: isset($row['deal_opportunity_id']) ? (string) $row['deal_opportunity_id'] : null,
            vaultDocumentId: isset($row['vault_document_id']) ? (string) $row['vault_document_id'] : null,
            invoiceClientId: isset($row['invoice_client_id']) ? (string) $row['invoice_client_id'] : null,
            lastError: isset($row['last_error']) ? (string) $row['last_error'] : null,
            attachmentId: isset($row['attachment_id']) ? (int) $row['attachment_id'] : null,
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
