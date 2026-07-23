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

/**
 * GET /admin/submissions/export — downloads every submission as CSV (bulk PII access,
 * audited server-side as `submission.exported`). The endpoint exports the full set and
 * does not honor the inbox filters, so this is deliberately an "export everything" action.
 * Triggers a browser download from the returned blob.
 */
export function useExportSubmissionsMutation(): UseMutationResult<string, AppError, void> {
  return useMutation<string, AppError>({
    mutationFn: async (): Promise<string> => {
      const { blob, filename } = await apiClient.getBlob('/admin/submissions/export');
      const name = filename ?? 'submissions.csv';
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
  });
}
