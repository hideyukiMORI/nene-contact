import type {
  SubmissionLink,
  SubmissionLinkDto,
  SubmissionLinkListDto,
} from '@/entities/submission-handoff/model';

export function toSubmissionLink(dto: SubmissionLinkDto): SubmissionLink {
  return {
    id: dto.id,
    submissionId: dto.submission_id,
    attachmentId: dto.attachment_id ?? null,
    target: dto.target,
    handoffStatus: dto.handoff_status,
    dealOpportunityId: dto.deal_opportunity_id ?? null,
    vaultDocumentId: dto.vault_document_id ?? null,
    invoiceClientId: dto.invoice_client_id ?? null,
    lastError: dto.last_error ?? null,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  };
}

export function toSubmissionLinks(dto: SubmissionLinkListDto): SubmissionLink[] {
  return (dto.items ?? []).map(toSubmissionLink);
}
