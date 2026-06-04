import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionListDto } from '@/entities/submission/api-types';
import { toSubmissionList } from '@/entities/submission/mapper';
import type { SubmissionList, SubmissionListParams } from '@/entities/submission/model';
import { submissionKeys } from '@/entities/submission/query-keys';

export function useSubmissionsQuery(
  params: SubmissionListParams,
): UseQueryResult<SubmissionList, AppError> {
  return useQuery<SubmissionList, AppError>({
    queryKey: submissionKeys.list(params),
    queryFn: async () =>
      toSubmissionList(
        await apiClient.get<SubmissionListDto>(
          `/admin/submissions?limit=${String(params.limit)}&offset=${String(params.offset)}`,
        ),
      ),
  });
}
