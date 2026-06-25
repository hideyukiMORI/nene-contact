import { describe, expect, it } from 'vitest';
import { toSubmissionLink, toSubmissionLinks } from '@/entities/submission-handoff';

describe('submission-handoff mapper', () => {
  it('maps snake_case to camelCase with null fallbacks', () => {
    const link = toSubmissionLink({
      id: 1,
      submission_id: 4,
      target: 'deal',
      handoff_status: 'succeeded',
      deal_opportunity_id: 'OPP-1',
    });

    expect(link).toMatchObject({
      id: 1,
      submissionId: 4,
      target: 'deal',
      handoffStatus: 'succeeded',
      dealOpportunityId: 'OPP-1',
      attachmentId: null,
      lastError: null,
    });
  });

  it('maps a list (missing items → [])', () => {
    expect(toSubmissionLinks({})).toEqual([]);

    const [vault] = toSubmissionLinks({
      items: [
        {
          id: 2,
          submission_id: 4,
          target: 'vault',
          handoff_status: 'failed',
          attachment_id: 9,
          last_error: 'boom',
        },
      ],
    });

    expect(vault).toMatchObject({ target: 'vault', attachmentId: 9, lastError: 'boom' });
  });
});
