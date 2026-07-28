import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import { appendAuditFilterParams } from '@/entities/audit-event/filter-params';
import type { AuditEventFilterParams } from '@/entities/audit-event/model';
import { auditEventKeys } from '@/entities/audit-event/query-keys';

/**
 * GET /admin/audit-events/export — downloads the filtered audit trail as CSV. The export is
 * a bulk read of the who/what/how record, audited server-side as `audit_event.exported`.
 * Triggers a browser download from the returned blob (same shape as the inbox export).
 *
 * The server writes that record *after* building the file, so the CSV never contains its own
 * row — correct, but it means the list on screen is one row stale the moment the download
 * finishes. Refetch it, or the operator sees no trace of the export they just performed and
 * concludes it was not recorded (#535).
 */
export function useExportAuditEventsMutation(): UseMutationResult<
  string,
  AppError,
  AuditEventFilterParams
> {
  const queryClient = useQueryClient();
  return useMutation<string, AppError, AuditEventFilterParams>({
    mutationFn: async (filter): Promise<string> => {
      const search = appendAuditFilterParams(new URLSearchParams(), filter).toString();
      const path =
        search === '' ? '/admin/audit-events/export' : `/admin/audit-events/export?${search}`;
      const { blob, filename } = await apiClient.getBlob(path);
      const name = filename ?? 'audit-events.csv';
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return name;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auditEventKeys.all });
    },
  });
}
