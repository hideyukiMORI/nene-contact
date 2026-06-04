import type { SubmissionDto, SubmissionListDto } from '@/entities/submission/api-types';
import type { Submission, SubmissionDetail, SubmissionList } from '@/entities/submission/model';

export function toSubmission(dto: SubmissionDto): Submission {
  return {
    id: dto.id,
    contactFormId: dto.contact_form_id,
    status: dto.status,
    submittedAt: dto.submitted_at ?? null,
  };
}

export function toSubmissionDetail(dto: SubmissionDto): SubmissionDetail {
  return {
    ...toSubmission(dto),
    fieldValues: dto.field_values ?? {},
    consentLabel: dto.consent_label ?? null,
    consentGivenAt: dto.consent_given_at ?? null,
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
