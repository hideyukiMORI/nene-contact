import { useSubmissionQuery, useUpdateSubmissionStatusMutation } from '@/entities/submission';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionDetail, SubmissionStatus } from '@/entities/submission';

interface UseSubmission {
  submission: SubmissionDetail | null;
  isLoading: boolean;
  error: AppError | null;
  refetch: () => void;
  updateStatus: (status: SubmissionStatus) => void;
  isUpdating: boolean;
}

export function useSubmission(id: number): UseSubmission {
  const query = useSubmissionQuery(id);
  const mutation = useUpdateSubmissionStatusMutation(id);

  return {
    submission: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    updateStatus: (status) => {
      mutation.mutate(status);
    },
    isUpdating: mutation.isPending,
  };
}
