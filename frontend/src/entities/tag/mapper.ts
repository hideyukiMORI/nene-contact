import type { TagDto, TagListDto } from '@/entities/tag/api-types';
import { toTagId } from '@/entities/tag/ids';
import type { Tag } from '@/entities/tag/model';

export function toTag(dto: TagDto): Tag {
  return {
    id: toTagId(dto.id),
    label: dto.label,
    color: dto.color,
    sortOrder: dto.sort_order,
  };
}

export function toTags(dto: TagListDto): Tag[] {
  return (dto.items ?? []).map(toTag);
}
