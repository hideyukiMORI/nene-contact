import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { CreateTagDto, TagDto, UpdateTagDto } from '@/entities/tag/api-types';
import type { TagId } from '@/entities/tag/ids';
import { toTag } from '@/entities/tag/mapper';
import type { CreateTagInput, Tag, UpdateTagInput } from '@/entities/tag/model';
import { tagKeys } from '@/entities/tag/query-keys';

/** POST /admin/tags — creates a tag (409 on duplicate label). */
export function useCreateTagMutation(): UseMutationResult<Tag, AppError, CreateTagInput> {
  const queryClient = useQueryClient();
  return useMutation<Tag, AppError, CreateTagInput>({
    mutationFn: async (input) => {
      const body: CreateTagDto = { label: input.label, color: input.color };
      return toTag(await apiClient.post<TagDto>('/admin/tags', body));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

/** PATCH /admin/tags/{id} — edits a tag (409 on a colliding rename). */
export function useUpdateTagMutation(): UseMutationResult<Tag, AppError, UpdateTagInput> {
  const queryClient = useQueryClient();
  return useMutation<Tag, AppError, UpdateTagInput>({
    mutationFn: async (input) => {
      const body: UpdateTagDto = {};
      if (input.label !== undefined) body.label = input.label;
      if (input.color !== undefined) body.color = input.color;
      if (input.sortOrder !== undefined) body.sort_order = input.sortOrder;
      return toTag(await apiClient.patch<TagDto>(`/admin/tags/${String(input.id)}`, body));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

/** DELETE /admin/tags/{id} — soft-deletes a tag (idempotent). */
export function useDeleteTagMutation(): UseMutationResult<TagId, AppError, TagId> {
  const queryClient = useQueryClient();
  return useMutation<TagId, AppError, TagId>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/tags/${String(id)}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}
