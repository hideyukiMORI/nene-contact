/**
 * Server-side cap on CSV exports (submissions inbox and audit log).
 *
 * Mirrors `MAX_ROWS` in `src/Audit/ExportAuditEventsUseCase.php` and
 * `src/Submission/ExportSubmissionsUseCase.php` — the API silently returns at most this many
 * rows. The console warns **before** the download when the current view matches more, so an
 * operator never hands an auditor a partial file believing it is complete (#531). The server
 * records the same truth after the fact (`count` vs `total_matched` in the audit event).
 */
export const EXPORT_MAX_ROWS = 10000;
