import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type {
  SubmissionDto,
  SubmissionListDto,
  SubmissionTechnicalMetaDto,
} from '@/entities/submission/api-types';
import {
  toSubmissionDetail,
  toSubmissionList,
  toSubmissionTechnicalMeta,
} from '@/entities/submission/mapper';
import type {
  SubmissionDetail,
  SubmissionList,
  SubmissionListParams,
  SubmissionTechnicalMeta,
} from '@/entities/submission/model';
import { submissionKeys } from '@/entities/submission/query-keys';

function buildQuery(params: SubmissionListParams): string {
  const search = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.status !== undefined) search.set('status', params.status);
  if (params.contactFormId !== undefined)
    search.set('contact_form_id', String(params.contactFormId));
  if (params.from !== undefined && params.from !== '') search.set('from', params.from);
  if (params.to !== undefined && params.to !== '') search.set('to', params.to);
  if (params.q !== undefined && params.q !== '') search.set('q', params.q);
  if (params.sort !== undefined) search.set('sort', params.sort);
  if (params.tagIds !== undefined && params.tagIds.length > 0)
    search.set('tag_id', params.tagIds.join(','));
  return search.toString();
}

export function useSubmissionsQuery(
  params: SubmissionListParams,
): UseQueryResult<SubmissionList, AppError> {
  return useQuery<SubmissionList, AppError>({
    queryKey: submissionKeys.list(params),
    queryFn: async () =>
      toSubmissionList(
        await apiClient.get<SubmissionListDto>(`/admin/submissions?${buildQuery(params)}`),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useSubmissionQuery(id: number): UseQueryResult<SubmissionDetail, AppError> {
  return useQuery<SubmissionDetail, AppError>({
    queryKey: submissionKeys.detail(id),
    queryFn: async () =>
      toSubmissionDetail(await apiClient.get<SubmissionDto>(`/admin/submissions/${String(id)}`)),
  });
}

/**
 * Discloses IP / User-Agent on demand (ADR 0018). Disabled until `enabled` is set so the
 * audited request fires only on an explicit operator reveal; not cached, so re-revealing
 * re-discloses (and re-audits) rather than reading a stale copy.
 */
export function useSubmissionTechnicalMetaQuery(
  id: number,
  enabled: boolean,
): UseQueryResult<SubmissionTechnicalMeta, AppError> {
  return useQuery<SubmissionTechnicalMeta, AppError>({
    queryKey: submissionKeys.technicalMeta(id),
    queryFn: async () =>
      toSubmissionTechnicalMeta(
        await apiClient.get<SubmissionTechnicalMetaDto>(
          `/admin/submissions/${String(id)}/technical-meta`,
        ),
      ),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}
