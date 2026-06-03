<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class ExportSubmissionsUseCase implements ExportSubmissionsUseCaseInterface
{
    private const MAX_ROWS = 10000;

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId): string
    {
        $rows = $this->submissions->findAll(self::MAX_ROWS, 0);

        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            throw new \RuntimeException('Could not open a temporary stream for CSV export.');
        }

        fputcsv($handle, ['id', 'contact_form_id', 'status', 'submitted_at', 'field_values'], ',', '"', '\\');

        foreach ($rows as $row) {
            fputcsv(
                $handle,
                [
                    (string) $row->id,
                    (string) $row->contactFormId,
                    $row->status,
                    (string) $row->submittedAt,
                    json_encode($row->fieldValues, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                ],
                ',',
                '"',
                '\\',
            );
        }

        rewind($handle);
        $csv = (string) stream_get_contents($handle);
        fclose($handle);

        // Bulk PII access — recorded without copying the exported values (charter §10).
        $this->audit->record(
            $actorUserId,
            $this->orgId->get(),
            'submission.exported',
            'submission',
            null,
            null,
            ['count' => count($rows)],
        );

        return $csv;
    }
}
