import { useState, type ReactNode } from 'react';
import {
  useOrganizationSettingsQuery,
  useUpdateOrganizationSettingsMutation,
} from '@/entities/organization';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';

export function OrganizationSettingsForm(): ReactNode {
  const { t } = useI18n();
  const query = useOrganizationSettingsQuery();
  const mutation = useUpdateOrganizationSettingsMutation();

  // A `null` draft means "untouched" — show the stored value; once edited we track the draft.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [sigDraft, setSigDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (query.isPending) {
    return <div className="fm-state">{t('common.loading')}</div>;
  }

  if (query.data === undefined) {
    return (
      <div className="au-note" role="alert">
        {t('orgSettings.error')}
      </div>
    );
  }

  const org = query.data;
  const name = nameDraft !== null ? nameDraft : (org.senderDisplayName ?? '');
  const signature = sigDraft !== null ? sigDraft : (org.emailSignature ?? '');

  const onSave = (): void => {
    const trimmedName = name.trim();
    const trimmedSig = signature.trim();
    setSaved(false);
    mutation.mutate(
      {
        senderDisplayName: trimmedName === '' ? null : trimmedName,
        emailSignature: trimmedSig === '' ? null : trimmedSig,
      },
      {
        onSuccess: () => {
          setNameDraft(null);
          setSigDraft(null);
          setSaved(true);
        },
      },
    );
  };

  return (
    <>
      <div className="bd-frow">
        <label className="l" htmlFor="org-sender-name">
          {t('orgSettings.senderName.label')}
        </label>
        <input
          id="org-sender-name"
          type="text"
          maxLength={100}
          value={name}
          placeholder={t('orgSettings.senderName.placeholder')}
          onChange={(e) => {
            setNameDraft(e.target.value);
            setSaved(false);
          }}
        />
        <p className="ac-lead">{t('orgSettings.senderName.hint', { name: org.name })}</p>
      </div>

      <div className="bd-frow">
        <label className="l" htmlFor="org-signature">
          {t('orgSettings.signature.label')}
        </label>
        <textarea
          id="org-signature"
          rows={5}
          maxLength={2000}
          value={signature}
          placeholder={t('orgSettings.signature.placeholder')}
          onChange={(e) => {
            setSigDraft(e.target.value);
            setSaved(false);
          }}
        />
        <p className="ac-lead">{t('orgSettings.signature.hint')}</p>
      </div>

      {mutation.error !== null ? (
        <div className="au-note" role="alert">
          {t('orgSettings.saveError')}
        </div>
      ) : saved ? (
        <div className="ch-testok" role="status">
          <Icon name="check" size={14} />
          {t('orgSettings.saved')}
        </div>
      ) : null}

      <button type="button" className="ex-btn" disabled={mutation.isPending} onClick={onSave}>
        <Icon name="check" size={14} />
        {mutation.isPending ? t('orgSettings.saving') : t('orgSettings.save')}
      </button>
    </>
  );
}
