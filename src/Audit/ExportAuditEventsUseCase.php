<?php

declare(strict_types=1);

namespace NeneContact\Audit;

use Nene2\Http\RequestScopedHolder;

/**
 * Exports the organization's audit trail as CSV, honoring the same filter the viewer uses.
 * The search repository is already tenant-scoped (multi-tenancy), and the export is itself
 * a bulk read of who/what/how records, so it records an `audit_event.exported` event —
 * carrying the row count and the filter that produced it, never the exported rows
 * (charter §10, ADR 0013).
 *
 * The export is capped at MAX_ROWS, so the record also carries `total_matched`: when it
 * exceeds `count`, the trail itself shows that the file an auditor received was **partial**
 * (#531). Without it, "exactly 10,000 rows" and "10,000 of 40,000" are indistinguishable
 * after the fact.
 */
final readonly class ExportAuditEventsUseCase implements ExportAuditEventsUseCaseInterface
{
    /** Mirrored by EXPORT_MAX_ROWS in frontend/src/shared/config/export.ts — keep in step. */
    public const MAX_ROWS = 10000;

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private AuditEventSearchRepositoryInterface $events,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(AuditEventFilter $filter, ?int $actorUserId): string
    {
        $rows = $this->events->search($filter, self::MAX_ROWS, 0);

        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            throw new \RuntimeException('Could not open a temporary stream for CSV export.');
        }

        fputcsv($handle, ['id', 'created_at', 'actor_user_id', 'action', 'entity_type', 'entity_id', 'before', 'after'], ',', '"', '\\');

        foreach ($rows as $row) {
            fputcsv(
                $handle,
                [
                    (string) $row->id,
                    (string) $row->createdAt,
                    $row->actorUserId !== null ? (string) $row->actorUserId : '',
                    $row->action,
                    $row->entityType,
                    $row->entityId !== null ? (string) $row->entityId : '',
                    self::encodeSnapshot($row->before),
                    self::encodeSnapshot($row->after),
                ],
                ',',
                '"',
                '\\',
            );
        }

        rewind($handle);
        $csv = (string) stream_get_contents($handle);
        fclose($handle);

        // Bulk access to the trail — recorded without copying the exported snapshots.
        // `total_matched` is what the filter matched before the cap, so a truncated export
        // is visible in the trail (count < total_matched).
        $this->audit->record(
            $actorUserId,
            $this->orgId->get(),
            'audit_event.exported',
            'audit_event',
            null,
            null,
            [
                'count' => count($rows),
                'total_matched' => $this->events->countMatching($filter),
                'filter' => [
                    'q' => $filter->q,
                    'from' => $filter->from,
                    'to' => $filter->to,
                ],
            ],
        );

        return $csv;
    }

    /**
     * @param array<string, mixed>|null $snapshot
     */
    private static function encodeSnapshot(?array $snapshot): string
    {
        if ($snapshot === null) {
            return '';
        }

        return json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
