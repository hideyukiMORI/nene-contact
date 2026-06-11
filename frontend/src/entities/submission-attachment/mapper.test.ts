import { describe, expect, it } from 'vitest';
import { toSubmissionAttachmentList } from '@/entities/submission-attachment/mapper';

describe('submission-attachment mapper', () => {
  it('maps the attachment list DTO to the domain shape', () => {
    const list = toSubmissionAttachmentList({
      items: [
        {
          id: 5,
          field_name: 'resume',
          original_filename: 'cv.pdf',
          content_type: 'application/pdf',
          size_bytes: 2048,
          scan_status: 'skipped',
        },
      ],
    });

    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toEqual({
      id: 5,
      fieldName: 'resume',
      originalFilename: 'cv.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
    });
  });

  it('defaults missing items to an empty list', () => {
    expect(toSubmissionAttachmentList({}).items).toEqual([]);
  });
});
