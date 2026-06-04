import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionDto } from '@/entities/submission/api-types';
import { toSubmissionDetail } from '@/entities/submission/mapper';
import type { SubmissionDetail, SubmissionStatus } from '@/entities/submission/model';
import { submissionKeys } from '@/entities/submission/query-keys';

export function useUpdateSubmissionStatusMutation(
  id: number,
): UseMutationResult<SubmissionDetail, AppError, SubmissionStatus> {
  const queryClient = useQueryClient();
  return useMutation<SubmissionDetail, AppError, SubmissionStatus>({
    mutationFn: async (status) =>
      toSubmissionDetail(
        await apiClient.patch<SubmissionDto>(`/admin/submissions/${String(id)}`, { status }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
