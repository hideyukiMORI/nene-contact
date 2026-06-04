<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

/**
 * Submissions persistence. {@see create()} uses the submission's own organization_id
 * (public submit resolves the org from public_form_key, ADR 0014); inbox reads are
 * organization-scoped via the resolved holder (ADR 0006).
 */
final readonly class PdoSubmissionRepository implements SubmissionRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, contact_form_id, field_values_json, consent_label_json, consent_given_at, status, source, ip, user_agent, submitted_at, created_at, updated_at';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function create(Submission $submission): int
    {
        $now = date('Y-m-d H:i:s');

        $this->query->execute(
            'INSERT INTO submissions (organization_id, contact_form_id, field_values_json, consent_label_json, consent_given_at, status, source, ip, user_agent, submitted_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $submission->organizationId,
                $submission->contactFormId,
                json_encode($submission->fieldValues, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                $submission->consentLabel !== null ? json_encode($submission->consentLabel, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE) : null,
                $submission->consentGivenAt,
                $submission->status,
                $submission->source,
                $submission->ip,
                $submission->userAgent,
                $now,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    public function findById(int $id): ?Submission
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM submissions WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$id, $this->orgId->get()],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->query->execute(
            'UPDATE submissions SET status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$status, date('Y-m-d H:i:s'), $id, $this->orgId->get()],
        );
    }

    public function softDelete(int $id): void
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'UPDATE submissions SET deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$now, $now, $id, $this->orgId->get()],
        );
    }

    /** @param array<string, mixed> $values */
    public function updateFieldValues(int $id, array $values): void
    {
        $this->query->execute(
            'UPDATE submissions SET field_values_json = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [
                json_encode($values, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                date('Y-m-d H:i:s'),
                $id,
                $this->orgId->get(),
            ],
        );
    }

    /** @return list<Submission> */
    public function findAll(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM submissions WHERE organization_id = ? AND deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?',
            [$this->orgId->get(), $limit, $offset],
        );

        return array_map(fn (array $row): Submission => $this->mapRow($row), $rows);
    }

    public function count(): int
    {
        $row = $this->query->fetchOne('SELECT COUNT(*) AS cnt FROM submissions WHERE organization_id = ? AND deleted_at IS NULL', [$this->orgId->get()]);

        return $row !== null ? (int) $row['cnt'] : 0;
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): Submission
    {
        $values = json_decode((string) $row['field_values_json'], true, 512, JSON_THROW_ON_ERROR);
        $consentLabel = isset($row['consent_label_json'])
            ? json_decode((string) $row['consent_label_json'], true, 512, JSON_THROW_ON_ERROR)
            : null;

        return new Submission(
            organizationId: (int) $row['organization_id'],
            contactFormId: (int) $row['contact_form_id'],
            fieldValues: is_array($values) ? $values : [],
            status: (string) $row['status'],
            source: isset($row['source']) ? (string) $row['source'] : 'form',
            ip: isset($row['ip']) ? (string) $row['ip'] : null,
            userAgent: isset($row['user_agent']) ? (string) $row['user_agent'] : null,
            consentLabel: is_array($consentLabel) ? $consentLabel : null,
            consentGivenAt: isset($row['consent_given_at']) ? (string) $row['consent_given_at'] : null,
            id: (int) $row['id'],
            submittedAt: (string) $row['submitted_at'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
