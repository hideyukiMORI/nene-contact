import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { SubmissionAttachment } from '@/entities/submission-attachment';
import {
  useSubmissionHandoffsQuery,
  useHandoffToDealMutation,
  useHandoffToInvoiceMutation,
  useHandoffAttachmentToVaultMutation,
  type SubmissionLink,
} from '@/entities/submission-handoff';

// One handoff target (Deal / Invoice / a Vault attachment). The outcome lives in the link's
// handoff_status (the POST is always HTTP 200), so a 200-with-failed shows the error, not success.
function HandoffRow({
  title,
  link,
  idLabel,
  idValue,
  sendLabel,
  pending,
  failed,
  onRun,
}: {
  title: string;
  link: SubmissionLink | null;
  idLabel: string;
  idValue: string | null;
  sendLabel: string;
  pending: boolean;
  failed: boolean;
  onRun: () => void;
}): ReactNode {
  const { t } = useI18n();
  const status = link?.handoffStatus ?? null;

  return (
    <div className="ho-card">
      <div className="ho-main">
        <div className="ho-title">{title}</div>
        {pending ? (
          <div className="ho-state pending">{t('submission.handoff.sending')}</div>
        ) : status === 'succeeded' ? (
          <div className="ho-state ok">
            <Icon name="check" size={12} />
            {t('submission.handoff.status.succeeded')}
            {idValue !== null ? (
              <span className="ho-id">
                {idLabel}: {idValue}
              </span>
            ) : null}
          </div>
        ) : status === 'failed' ? (
          <div className="ho-state err">
            <Icon name="warn" size={12} />
            {t('submission.handoff.status.failed')}
            {link?.lastError !== null && link?.lastError !== undefined ? (
              <span className="ho-errmsg">{link.lastError}</span>
            ) : null}
          </div>
        ) : status === 'pending' ? (
          <div className="ho-state pending">{t('submission.handoff.status.pending')}</div>
        ) : (
          <div className="ho-state none">{t('submission.handoff.notLinked')}</div>
        )}
        {failed ? <div className="ho-state err">{t('submission.handoff.error')}</div> : null}
      </div>
      <button type="button" className="ex-btn ghost" disabled={pending} onClick={onRun}>
        <Icon name={link !== null ? 'play' : 'send'} size={14} />
        {pending
          ? t('submission.handoff.sending')
          : link !== null
            ? t('submission.handoff.retry')
            : sendLabel}
      </button>
    </div>
  );
}

// 連携 (Handoff) section on the submission detail. Deal/Invoice are per submission; Vault is per
// attachment. Every operator role has ManageSubmissions, so the actions aren't role-gated; a failed
// POST surfaces its error and can be retried. Shows ids/status only — never visitor PII.
export function HandoffPanel({
  submissionId,
  attachments,
}: {
  submissionId: number;
  attachments: SubmissionAttachment[];
}): ReactNode {
  const { t } = useI18n();
  const handoffs = useSubmissionHandoffsQuery(submissionId);
  const links = handoffs.data ?? [];

  const dealLink = links.find((l) => l.target === 'deal') ?? null;
  const invoiceLink = links.find((l) => l.target === 'invoice') ?? null;
  const vaultLinkFor = (attachmentId: number): SubmissionLink | null =>
    links.find((l) => l.target === 'vault' && l.attachmentId === attachmentId) ?? null;

  const deal = useHandoffToDealMutation(submissionId);
  const invoice = useHandoffToInvoiceMutation(submissionId);
  const vault = useHandoffAttachmentToVaultMutation(submissionId);

  return (
    <section className="ho-sec">
      <div className="sec-lab">{t('submission.handoff.section')}</div>
      <p className="ho-note">{t('submission.handoff.note200')}</p>

      <HandoffRow
        title={t('submission.handoff.deal.title')}
        link={dealLink}
        idLabel={t('submission.handoff.dealId')}
        idValue={dealLink?.dealOpportunityId ?? null}
        sendLabel={t('submission.handoff.deal.send')}
        pending={deal.isPending}
        failed={deal.isError}
        onRun={() => {
          deal.mutate();
        }}
      />

      <HandoffRow
        title={t('submission.handoff.invoice.title')}
        link={invoiceLink}
        idLabel={t('submission.handoff.invoiceId')}
        idValue={invoiceLink?.invoiceClientId ?? null}
        sendLabel={t('submission.handoff.invoice.send')}
        pending={invoice.isPending}
        failed={invoice.isError}
        onRun={() => {
          invoice.mutate();
        }}
      />

      <div className="ho-vaulthead">{t('submission.handoff.vault.title')}</div>
      {attachments.length === 0 ? (
        <p className="ho-empty">{t('submission.handoff.vault.none')}</p>
      ) : (
        attachments.map((attachment) => {
          const link = vaultLinkFor(attachment.id);
          return (
            <HandoffRow
              key={attachment.id}
              title={attachment.originalFilename}
              link={link}
              idLabel={t('submission.handoff.vaultId')}
              idValue={link?.vaultDocumentId ?? null}
              sendLabel={t('submission.handoff.vault.send')}
              pending={vault.isPending && vault.variables === attachment.id}
              failed={vault.isError && vault.variables === attachment.id}
              onRun={() => {
                vault.mutate(attachment.id);
              }}
            />
          );
        })
      )}
    </section>
  );
}
