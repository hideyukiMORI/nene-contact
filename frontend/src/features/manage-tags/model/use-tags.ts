import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagsQuery,
  useUpdateTagMutation,
} from '@/entities/tag';
import type { CreateTagInput, Tag, TagId, UpdateTagInput } from '@/entities/tag';
import type { AppError } from '@/shared/api/errors';

interface UseTags {
  tags: Tag[];
  isLoading: boolean;
  error: AppError | null;
  createTag: (input: CreateTagInput) => Promise<Tag>;
  updateTag: (input: UpdateTagInput) => Promise<Tag>;
  deleteTag: (id: TagId) => void;
  isSaving: boolean;
  saveError: AppError | null;
  deleteError: AppError | null;
}

export function useTags(): UseTags {
  const query = useTagsQuery();
  const create = useCreateTagMutation();
  const update = useUpdateTagMutation();
  const remove = useDeleteTagMutation();

  return {
    tags: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    createTag: create.mutateAsync,
    updateTag: update.mutateAsync,
    deleteTag: (id) => {
      remove.mutate(id);
    },
    isSaving: create.isPending || update.isPending,
    saveError: create.error ?? update.error,
    deleteError: remove.error,
  };
}
