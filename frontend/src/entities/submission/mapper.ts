import type {
  SubmissionDto,
  SubmissionListDto,
  SubmissionTechnicalMetaDto,
} from '@/entities/submission/api-types';
import type {
  Submission,
  SubmissionDetail,
  SubmissionList,
  SubmissionTechnicalMeta,
} from '@/entities/submission/model';

export function toSubmission(dto: SubmissionDto): Submission {
  return {
    id: dto.id,
    contactFormId: dto.contact_form_id,
    status: dto.status,
    submittedAt: dto.submitted_at ?? null,
    fieldValues: dto.field_values ?? {},
  };
}

export function toSubmissionDetail(dto: SubmissionDto): SubmissionDetail {
  return {
    ...toSubmission(dto),
    source: dto.source ?? 'form',
    sourceUrl: dto.source_url ?? null,
    consentLabel: dto.consent_label ?? null,
    consentGivenAt: dto.consent_given_at ?? null,
  };
}

export function toSubmissionTechnicalMeta(
  dto: SubmissionTechnicalMetaDto,
): SubmissionTechnicalMeta {
  return {
    id: dto.id,
    ip: dto.ip ?? null,
    userAgent: dto.user_agent ?? null,
  };
}

export function toSubmissionList(dto: SubmissionListDto): SubmissionList {
  return {
    items: (dto.items ?? []).map(toSubmission),
    total: dto.total ?? 0,
    limit: dto.limit ?? 0,
    offset: dto.offset ?? 0,
    statusCounts: dto.status_counts ?? {},
  };
}
