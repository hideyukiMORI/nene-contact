import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { AuditEventListDto } from '@/entities/audit-event/api-types';
import { toAuditEventList } from '@/entities/audit-event/mapper';
import type { AuditEventList, AuditEventListParams } from '@/entities/audit-event/model';
import { auditEventKeys } from '@/entities/audit-event/query-keys';

export function useAuditEventsQuery(
  params: AuditEventListParams,
): UseQueryResult<AuditEventList, AppError> {
  const search = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q !== undefined && params.q !== '') search.set('q', params.q);
  if (params.from !== undefined && params.from !== '') search.set('from', params.from);
  if (params.to !== undefined && params.to !== '') search.set('to', params.to);
  return useQuery<AuditEventList, AppError>({
    queryKey: auditEventKeys.list(params),
    queryFn: async () =>
      toAuditEventList(
        await apiClient.get<AuditEventListDto>(`/admin/audit-events?${search.toString()}`),
      ),
    placeholderData: keepPreviousData,
  });
}
