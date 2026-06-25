export { useSubmissionHandoffsQuery } from '@/entities/submission-handoff/queries';
export {
  useHandoffToDealMutation,
  useHandoffToInvoiceMutation,
  useHandoffAttachmentToVaultMutation,
} from '@/entities/submission-handoff/mutations';
export { toSubmissionLink, toSubmissionLinks } from '@/entities/submission-handoff/mapper';
export { submissionHandoffKeys } from '@/entities/submission-handoff/query-keys';
export type {
  SubmissionLink,
  SubmissionLinkDto,
  SubmissionLinkListDto,
  HandoffTarget,
  HandoffStatus,
} from '@/entities/submission-handoff/model';
