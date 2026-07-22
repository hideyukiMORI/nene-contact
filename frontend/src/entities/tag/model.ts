import type { TagId } from '@/entities/tag/ids';

/** The fixed tag colour tokens (ADR 0019); `slate` is the default. */
export type TagColor = 'slate' | 'wisteria' | 'teal' | 'green' | 'amber' | 'rose' | 'orange';

export const TAG_COLORS: TagColor[] = [
  'slate',
  'wisteria',
  'teal',
  'green',
  'amber',
  'rose',
  'orange',
];

export const DEFAULT_TAG_COLOR: TagColor = 'slate';

/** UI read model for an org tag. */
export interface Tag {
  id: TagId;
  label: string;
  color: TagColor;
  sortOrder: number;
}

export interface CreateTagInput {
  label: string;
  color: TagColor;
}

export interface UpdateTagInput {
  id: TagId;
  label?: string;
  color?: TagColor;
  sortOrder?: number;
}
