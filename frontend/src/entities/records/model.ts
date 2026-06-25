import type { components } from '@/shared/api/schema.gen';

// A select option fetched from a NeNe Records entity (read-only over HTTP; Records is the SSOT —
// ADR 0002). `value` is the stable key; `label` is the display text.
export interface RecordsOption {
  value: string;
  label: string;
}

export type RecordsOptionsDto = components['schemas']['RecordsOptionsResponse'];
