import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { ServiceTokenListDto } from '@/entities/service-token/api-types';
import { toServiceTokens } from '@/entities/service-token/mapper';
import type { ServiceToken } from '@/entities/service-token/model';
import { serviceTokenKeys } from '@/entities/service-token/query-keys';

/** GET /admin/service-tokens — registry list (metadata only, never the token value). */
export function useServiceTokensQuery(): UseQueryResult<ServiceToken[], AppError> {
  return useQuery<ServiceToken[], AppError>({
    queryKey: serviceTokenKeys.list(),
    queryFn: async () =>
      toServiceTokens(await apiClient.get<ServiceTokenListDto>('/admin/service-tokens')),
  });
}
