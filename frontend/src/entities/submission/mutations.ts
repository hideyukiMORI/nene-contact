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

/** POST /admin/submissions/{id}/tags — applies a tag to the submission (idempotent). */
export function useAddSubmissionTagMutation(
  submissionId: number,
): UseMutationResult<number, AppError, number> {
  const queryClient = useQueryClient();
  return useMutation<number, AppError, number>({
    mutationFn: async (tagId) => {
      await apiClient.post(`/admin/submissions/${String(submissionId)}/tags`, { tag_id: tagId });
      return tagId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(submissionId) });
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}

/** DELETE /admin/submissions/{id}/tags/{tagId} — removes a tag (idempotent). */
export function useRemoveSubmissionTagMutation(
  submissionId: number,
): UseMutationResult<number, AppError, number> {
  const queryClient = useQueryClient();
  return useMutation<number, AppError, number>({
    mutationFn: async (tagId) => {
      await apiClient.delete(`/admin/submissions/${String(submissionId)}/tags/${String(tagId)}`);
      return tagId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(submissionId) });
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
