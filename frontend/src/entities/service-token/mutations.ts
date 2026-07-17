import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type {
  CreatedServiceTokenDto,
  IssueServiceTokenDto,
} from '@/entities/service-token/api-types';
import type { ServiceTokenId } from '@/entities/service-token/ids';
import { toIssuedServiceToken } from '@/entities/service-token/mapper';
import type { IssuedServiceToken, IssueServiceTokenInput } from '@/entities/service-token/model';
import { serviceTokenKeys } from '@/entities/service-token/query-keys';

/** POST /admin/service-tokens — issues a token; returns the one-time plaintext value. */
export function useIssueServiceTokenMutation(): UseMutationResult<
  IssuedServiceToken,
  AppError,
  IssueServiceTokenInput
> {
  const queryClient = useQueryClient();
  return useMutation<IssuedServiceToken, AppError, IssueServiceTokenInput>({
    mutationFn: async (input) => {
      const body: IssueServiceTokenDto = { label: input.label, scopes: input.scopes };
      return toIssuedServiceToken(
        await apiClient.post<CreatedServiceTokenDto>('/admin/service-tokens', body),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceTokenKeys.all });
    },
  });
}

/** DELETE /admin/service-tokens/{id} — revokes a token (idempotent). */
export function useRevokeServiceTokenMutation(): UseMutationResult<
  ServiceTokenId,
  AppError,
  ServiceTokenId
> {
  const queryClient = useQueryClient();
  return useMutation<ServiceTokenId, AppError, ServiceTokenId>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/service-tokens/${String(id)}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceTokenKeys.all });
    },
  });
}
