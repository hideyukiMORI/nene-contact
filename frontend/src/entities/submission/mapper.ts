import type { SubmissionDto, SubmissionListDto } from '@/entities/submission/api-types';
import type { Submission, SubmissionList } from '@/entities/submission/model';

export function toSubmission(dto: SubmissionDto): Submission {
  return {
    id: dto.id,
    contactFormId: dto.contact_form_id,
    status: dto.status,
    submittedAt: dto.submitted_at ?? null,
  };
}

export function toSubmissionList(dto: SubmissionListDto): SubmissionList {
  return {
    items: (dto.items ?? []).map(toSubmission),
    total: dto.total ?? 0,
    limit: dto.limit ?? 0,
    offset: dto.offset ?? 0,
  };
}
