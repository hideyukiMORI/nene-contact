import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionDto, SubmissionListDto } from '@/entities/submission/api-types';
import { toSubmissionDetail, toSubmissionList } from '@/entities/submission/mapper';
import type {
  SubmissionDetail,
  SubmissionList,
  SubmissionListParams,
} from '@/entities/submission/model';
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

export function useSubmissionQuery(id: number): UseQueryResult<SubmissionDetail, AppError> {
  return useQuery<SubmissionDetail, AppError>({
    queryKey: submissionKeys.detail(id),
    queryFn: async () =>
      toSubmissionDetail(await apiClient.get<SubmissionDto>(`/admin/submissions/${String(id)}`)),
  });
}
