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

  // `draft === null` means "untouched" — show the stored value; once edited we track the draft.
  const [draft, setDraft] = useState<string | null>(null);
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
  const value = draft !== null ? draft : (org.senderDisplayName ?? '');

  const onSave = (): void => {
    const trimmed = value.trim();
    setSaved(false);
    mutation.mutate(
      { senderDisplayName: trimmed === '' ? null : trimmed },
      {
        onSuccess: () => {
          setDraft(null);
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
          value={value}
          placeholder={t('orgSettings.senderName.placeholder')}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
        />
        <p className="ac-lead">{t('orgSettings.senderName.hint', { name: org.name })}</p>
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
