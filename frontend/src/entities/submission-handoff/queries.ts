import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import { toSubmissionLinks } from '@/entities/submission-handoff/mapper';
import type { SubmissionLink, SubmissionLinkListDto } from '@/entities/submission-handoff/model';
import { submissionHandoffKeys } from '@/entities/submission-handoff/query-keys';

export function useSubmissionHandoffsQuery(
  submissionId: number,
  enabled = true,
): UseQueryResult<SubmissionLink[], AppError> {
  return useQuery<SubmissionLink[], AppError>({
    queryKey: submissionHandoffKeys.list(submissionId),
    enabled: enabled && submissionId > 0,
    queryFn: async () =>
      toSubmissionLinks(
        await apiClient.get<SubmissionLinkListDto>(
          `/admin/submissions/${String(submissionId)}/handoffs`,
        ),
      ),
  });
}
