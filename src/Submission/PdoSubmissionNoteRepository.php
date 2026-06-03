<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

final readonly class PdoSubmissionNoteRepository implements SubmissionNoteRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, submission_id, author_user_id, body, created_at';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function create(SubmissionNote $note): int
    {
        $this->query->execute(
            'INSERT INTO submission_notes (organization_id, submission_id, author_user_id, body, created_at)
             VALUES (?, ?, ?, ?, ?)',
            [$note->organizationId, $note->submissionId, $note->authorUserId, $note->body, date('Y-m-d H:i:s')],
        );

        return $this->query->lastInsertId();
    }

    /** @return list<SubmissionNote> */
    public function listBySubmission(int $submissionId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM submission_notes WHERE submission_id = ? AND organization_id = ? ORDER BY id ASC',
            [$submissionId, $this->orgId->get()],
        );

        return array_map(static fn (array $row): SubmissionNote => new SubmissionNote(
            organizationId: (int) $row['organization_id'],
            submissionId: (int) $row['submission_id'],
            body: (string) $row['body'],
            authorUserId: isset($row['author_user_id']) ? (int) $row['author_user_id'] : null,
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
        ), $rows);
    }
}
