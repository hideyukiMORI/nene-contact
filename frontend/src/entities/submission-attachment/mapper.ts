import type {
  SubmissionAttachmentDto,
  SubmissionAttachmentListDto,
} from '@/entities/submission-attachment/api-types';
import type {
  SubmissionAttachment,
  SubmissionAttachmentList,
} from '@/entities/submission-attachment/model';

export function toSubmissionAttachment(dto: SubmissionAttachmentDto): SubmissionAttachment {
  return {
    id: dto.id,
    fieldName: dto.field_name,
    originalFilename: dto.original_filename,
    contentType: dto.content_type,
    sizeBytes: dto.size_bytes,
  };
}

export function toSubmissionAttachmentList(
  dto: SubmissionAttachmentListDto,
): SubmissionAttachmentList {
  return { items: (dto.items ?? []).map(toSubmissionAttachment) };
}
