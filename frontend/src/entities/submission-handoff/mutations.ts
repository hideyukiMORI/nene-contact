import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import { toSubmissionLink } from '@/entities/submission-handoff/mapper';
import type { SubmissionLink, SubmissionLinkDto } from '@/entities/submission-handoff/model';
import { submissionHandoffKeys } from '@/entities/submission-handoff/query-keys';

// Each handoff POST returns the resulting link (HTTP is always 200 — the outcome is in
// handoff_status). Re-POST retries (idempotent). On success the handoffs list is invalidated so
// the panel reflects the new status.
function useHandoffMutation<TVars = void>(
  submissionId: number,
  buildPath: (submissionId: number, vars: TVars) => string,
): UseMutationResult<SubmissionLink, AppError, TVars> {
  const queryClient = useQueryClient();
  return useMutation<SubmissionLink, AppError, TVars>({
    mutationFn: async (vars: TVars) =>
      toSubmissionLink(await apiClient.post<SubmissionLinkDto>(buildPath(submissionId, vars))),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: submissionHandoffKeys.list(submissionId),
      });
    },
  });
}

export function useHandoffToDealMutation(
  submissionId: number,
): UseMutationResult<SubmissionLink, AppError, void> {
  return useHandoffMutation(submissionId, (id) => `/admin/submissions/${String(id)}/handoffs/deal`);
}

export function useHandoffToInvoiceMutation(
  submissionId: number,
): UseMutationResult<SubmissionLink, AppError, void> {
  return useHandoffMutation(
    submissionId,
    (id) => `/admin/submissions/${String(id)}/handoffs/invoice`,
  );
}

export function useHandoffAttachmentToVaultMutation(
  submissionId: number,
): UseMutationResult<SubmissionLink, AppError, number> {
  return useHandoffMutation<number>(
    submissionId,
    (id, attachmentId) => `/admin/submissions/${String(id)}/handoffs/vault/${String(attachmentId)}`,
  );
}
