import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import { toRecordsOptions } from '@/entities/records/mapper';
import type { RecordsOption, RecordsOptionsDto } from '@/entities/records/model';
import { recordsKeys } from '@/entities/records/query-keys';

// Shared query definition so a component can either subscribe (useQuery) or fetch on demand
// (queryClient.fetchQuery) — the choice editor imports on a button click. ManageForms-gated.
export function recordsOptionsQuery(source: string): {
  queryKey: ReturnType<typeof recordsKeys.options>;
  queryFn: () => Promise<RecordsOption[]>;
} {
  const key = source.trim();
  return {
    queryKey: recordsKeys.options(key),
    queryFn: async () =>
      toRecordsOptions(
        await apiClient.get<RecordsOptionsDto>(
          `/admin/records/options?source=${encodeURIComponent(key)}`,
        ),
      ),
  };
}

export function useRecordsOptionsQuery(
  source: string,
  enabled = true,
): UseQueryResult<RecordsOption[], AppError> {
  return useQuery<RecordsOption[], AppError>({
    ...recordsOptionsQuery(source),
    enabled: enabled && source.trim() !== '',
  });
}
