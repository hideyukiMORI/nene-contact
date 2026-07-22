import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { TagListDto } from '@/entities/tag/api-types';
import { toTags } from '@/entities/tag/mapper';
import type { Tag } from '@/entities/tag/model';
import { tagKeys } from '@/entities/tag/query-keys';

/** GET /admin/tags — the org's tag vocabulary (non-deleted, ordered). */
export function useTagsQuery(): UseQueryResult<Tag[], AppError> {
  return useQuery<Tag[], AppError>({
    queryKey: tagKeys.list(),
    queryFn: async () => toTags(await apiClient.get<TagListDto>('/admin/tags')),
  });
}
