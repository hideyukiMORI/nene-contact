import { useSubmissionsQuery } from '@/entities/submission';
import type { AppError } from '@/shared/api/errors';
import type { Submission, SubmissionListParams } from '@/entities/submission';

interface UseSubmissions {
  submissions: Submission[];
  total: number;
  statusCounts: Record<string, number>;
  isLoading: boolean;
  isFetching: boolean;
  error: AppError | null;
  refetch: () => void;
}

// Thin wrapper over the entity query: filtering/paging are server-side (the list is masked,
// so PII is never searched or held in bulk on the client).
export function useSubmissions(params: SubmissionListParams): UseSubmissions {
  const query = useSubmissionsQuery(params);

  return {
    submissions: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    statusCounts: query.data?.statusCounts ?? {},
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
