import type { components } from '@/shared/api/schema.gen';

export type HandoffTarget = 'deal' | 'vault' | 'invoice';
export type HandoffStatus = 'pending' | 'succeeded' | 'failed';

// A submission → sibling-product link (Deal opportunity / Invoice client / Vault document).
// Carries operator metadata only (ids + status), never visitor PII.
export interface SubmissionLink {
  id: number;
  submissionId: number;
  attachmentId: number | null;
  target: HandoffTarget;
  handoffStatus: HandoffStatus;
  dealOpportunityId: string | null;
  vaultDocumentId: string | null;
  invoiceClientId: string | null;
  lastError: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SubmissionLinkDto = components['schemas']['SubmissionLinkResponse'];
export type SubmissionLinkListDto = components['schemas']['SubmissionLinkListResponse'];
