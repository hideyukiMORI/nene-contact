import type { AuditEvent } from '@/entities/audit-event';

export type DiffKind = 'added' | 'removed' | 'changed';

export interface DiffRow {
  key: string;
  before: string | null;
  after: string | null;
  kind: DiffKind;
}

/** Render any snapshot value compactly: primitives as-is, objects/arrays as JSON. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

/**
 * Diff the before/after snapshots into the rows worth showing:
 * create → every after field (added), delete → every before field (removed),
 * update → only the fields whose value changed.
 */
export function diffRows(event: AuditEvent): DiffRow[] {
  const { before, after } = event;
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  const rows: DiffRow[] = [];

  for (const key of keys) {
    const hadBefore = before !== null && key in before;
    const hadAfter = after !== null && key in after;
    const b = hadBefore ? formatValue(before[key]) : null;
    const a = hadAfter ? formatValue(after[key]) : null;

    if (before === null && after !== null) {
      rows.push({ key, before: null, after: a, kind: 'added' });
    } else if (after === null && before !== null) {
      rows.push({ key, before: b, after: null, kind: 'removed' });
    } else if (b !== a) {
      rows.push({
        key,
        before: b,
        after: a,
        kind: !hadBefore ? 'added' : !hadAfter ? 'removed' : 'changed',
      });
    }
  }

  return rows;
}
