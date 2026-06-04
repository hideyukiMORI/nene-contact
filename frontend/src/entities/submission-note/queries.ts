import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionNoteListDto } from '@/entities/submission-note/api-types';
import { toSubmissionNotes } from '@/entities/submission-note/mapper';
import type { SubmissionNote } from '@/entities/submission-note/model';
import { submissionNoteKeys } from '@/entities/submission-note/query-keys';

export function useSubmissionNotesQuery(
  submissionId: number,
): UseQueryResult<SubmissionNote[], AppError> {
  return useQuery<SubmissionNote[], AppError>({
    queryKey: submissionNoteKeys.list(submissionId),
    queryFn: async () =>
      toSubmissionNotes(
        await apiClient.get<SubmissionNoteListDto>(
          `/admin/submissions/${String(submissionId)}/notes`,
        ),
      ),
  });
}
