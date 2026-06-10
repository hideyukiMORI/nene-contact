import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import { ManageChannels } from '@/features/manage-channels';

export function ChannelsPage(): ReactNode {
  const { t } = useI18n();
  const { id } = useParams();
  const contactFormId = Number(id);

  const formsQuery = useContactFormsQuery();
  const formName = formsQuery.data?.items.find((f) => f.id === contactFormId)?.name ?? '';

  return (
    <div className="fm-body">
      <Link className="ch-back" to="/contact-forms">
        <Icon name="arrowLeft" size={15} />
        {t('channels.back')}
      </Link>

      <div className="fm-head">
        <h1>{t('channels.title')}</h1>
      </div>
      <p className="ex-lead">{t('channels.lead', { name: formName })}</p>

      <div className="md-note">
        <Icon name="info" size={15} />
        <div>{t('channels.notice')}</div>
      </div>

      {Number.isNaN(contactFormId) ? null : <ManageChannels contactFormId={contactFormId} />}
    </div>
  );
}
