import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionAttachmentListDto } from '@/entities/submission-attachment/api-types';
import { toSubmissionAttachmentList } from '@/entities/submission-attachment/mapper';
import type { SubmissionAttachmentList } from '@/entities/submission-attachment/model';
import { submissionAttachmentKeys } from '@/entities/submission-attachment/query-keys';

// Lists a submission's attachments for the inquiry detail. `enabled` defers the fetch until
// the submission id is known.
export function useSubmissionAttachmentsQuery(
  submissionId: number,
  enabled = true,
): UseQueryResult<SubmissionAttachmentList, AppError> {
  return useQuery<SubmissionAttachmentList, AppError>({
    queryKey: submissionAttachmentKeys.list(submissionId),
    queryFn: async () =>
      toSubmissionAttachmentList(
        await apiClient.get<SubmissionAttachmentListDto>(
          `/admin/submissions/${String(submissionId)}/attachments`,
        ),
      ),
    enabled: enabled && submissionId > 0,
  });
}
