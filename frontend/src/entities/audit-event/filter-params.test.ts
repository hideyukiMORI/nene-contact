import { describe, expect, it } from 'vitest';
import { appendAuditFilterParams } from '@/entities/audit-event/filter-params';

describe('appendAuditFilterParams', () => {
  it('carries the active filter so an export matches the list', () => {
    const search = appendAuditFilterParams(new URLSearchParams(), {
      q: 'contact_form',
      from: '2026-07-01',
      to: '2026-07-24',
    });
    expect(search.toString()).toBe('q=contact_form&from=2026-07-01&to=2026-07-24');
  });

  it('omits empty and undefined values instead of sending blanks', () => {
    const search = appendAuditFilterParams(new URLSearchParams(), { q: '', from: '2026-07-01' });
    expect(search.toString()).toBe('from=2026-07-01');
  });

  it('keeps the params it is given', () => {
    const search = appendAuditFilterParams(new URLSearchParams({ limit: '20', offset: '0' }), {
      q: 'user',
    });
    expect(search.toString()).toBe('limit=20&offset=0&q=user');
  });
});
