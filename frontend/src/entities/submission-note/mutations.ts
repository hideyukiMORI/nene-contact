import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionNoteDto } from '@/entities/submission-note/api-types';
import { toSubmissionNote } from '@/entities/submission-note/mapper';
import type { SubmissionNote } from '@/entities/submission-note/model';
import { submissionNoteKeys } from '@/entities/submission-note/query-keys';

export function useAddSubmissionNoteMutation(
  submissionId: number,
): UseMutationResult<SubmissionNote, AppError, string> {
  const queryClient = useQueryClient();
  return useMutation<SubmissionNote, AppError, string>({
    mutationFn: async (body) =>
      toSubmissionNote(
        await apiClient.post<SubmissionNoteDto>(
          `/admin/submissions/${String(submissionId)}/notes`,
          { body },
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: submissionNoteKeys.list(submissionId) });
    },
  });
}
