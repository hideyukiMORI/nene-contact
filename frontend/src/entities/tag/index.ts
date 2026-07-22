export { type TagId, toTagId } from '@/entities/tag/ids';
export { toTag, toTags } from '@/entities/tag/mapper';
export { tagKeys } from '@/entities/tag/query-keys';
export { useTagsQuery } from '@/entities/tag/queries';
export {
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '@/entities/tag/mutations';
export {
  TAG_COLORS,
  DEFAULT_TAG_COLOR,
  type TagColor,
  type Tag,
  type CreateTagInput,
  type UpdateTagInput,
} from '@/entities/tag/model';
