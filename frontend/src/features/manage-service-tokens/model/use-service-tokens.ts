import {
  useIssueServiceTokenMutation,
  useRevokeServiceTokenMutation,
  useServiceTokensQuery,
} from '@/entities/service-token';
import type {
  IssuedServiceToken,
  IssueServiceTokenInput,
  ServiceToken,
  ServiceTokenId,
} from '@/entities/service-token';
import type { AppError } from '@/shared/api/errors';

interface UseServiceTokens {
  tokens: ServiceToken[];
  isLoading: boolean;
  error: AppError | null;
  issueToken: (input: IssueServiceTokenInput) => Promise<IssuedServiceToken>;
  isIssuing: boolean;
  issueError: AppError | null;
  revokeToken: (id: ServiceTokenId) => void;
  revokeError: AppError | null;
}

export function useServiceTokens(): UseServiceTokens {
  const query = useServiceTokensQuery();
  const issue = useIssueServiceTokenMutation();
  const revoke = useRevokeServiceTokenMutation();

  return {
    tokens: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    issueToken: issue.mutateAsync,
    isIssuing: issue.isPending,
    issueError: issue.error,
    revokeToken: (id) => {
      revoke.mutate(id);
    },
    revokeError: revoke.error,
  };
}
