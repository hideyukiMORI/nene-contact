import { describe, expect, it } from 'vitest';
import { toSubmissionNote, toSubmissionNotes } from '@/entities/submission-note/mapper';

describe('submission-note mappers', () => {
  it('maps a note DTO to the model', () => {
    expect(
      toSubmissionNote({
        id: 1,
        submission_id: 9,
        author_user_id: 5,
        body: 'called the customer',
        created_at: '2026-06-04 00:00:00',
      }),
    ).toEqual({
      id: 1,
      submissionId: 9,
      authorUserId: 5,
      body: 'called the customer',
      createdAt: '2026-06-04 00:00:00',
    });
  });

  it('maps an empty list', () => {
    expect(toSubmissionNotes({ items: [] })).toEqual([]);
  });
});
