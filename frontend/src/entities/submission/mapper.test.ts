import { describe, expect, it } from 'vitest';
import { toSubmission, toSubmissionList } from '@/entities/submission/mapper';

describe('submission mappers', () => {
  it('maps a submission DTO to the model', () => {
    expect(
      toSubmission({
        id: 9,
        contact_form_id: 3,
        status: 'open',
        field_values: { email: 'x@example.com' },
        submitted_at: '2026-06-04 00:00:00',
        tags: [{ id: 2, label: '見積', color: 'amber' }],
      }),
    ).toEqual({
      id: 9,
      contactFormId: 3,
      status: 'open',
      submittedAt: '2026-06-04 00:00:00',
      fieldValues: { email: 'x@example.com' },
      tags: [{ id: 2, label: '見積', color: 'amber' }],
    });
  });

  it('maps a list with paging metadata and defaults', () => {
    expect(toSubmissionList({ items: [], total: 5, limit: 20, offset: 0 })).toEqual({
      items: [],
      total: 5,
      limit: 20,
      offset: 0,
      statusCounts: {},
    });
  });
});
